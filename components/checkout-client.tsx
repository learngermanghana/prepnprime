'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { getCartItemKey, toCheckoutItems } from '@/lib/cart';
import { formatGHS, formatMinorGHS } from '@/lib/format';
import type { CheckoutCreateResponse, CheckoutPreviewResponse } from '@/lib/types';

const fallbackImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80';
const CHECKOUT_SNAPSHOT_KEY = 'checkout:last_customer';
const FEE_RATE = 0.0195;

function normalizeImageUrl(url?: string | null) {
  if (!url?.trim()) return fallbackImage;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  return encodeURI(url);
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

function estimateServiceChargeMinor(subtotalMinor: number) {
  if (subtotalMinor <= 0) return 0;
  return Math.max(0, Math.ceil(subtotalMinor / (1 - FEE_RATE)) - subtotalMinor);
}

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  deliveryLocation: string;
  note: string;
};

export function CheckoutClient() {
  const { items, count, estimatedTotal, updateQuantity, removeItem, clearCart } = useCart();
  const [customer, setCustomer] = useState<CustomerForm>({ name: '', email: '', phone: '', deliveryLocation: '', note: '' });
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [previewNotice, setPreviewNotice] = useState('');

  const checkoutItems = useMemo(() => toCheckoutItems(items), [items]);
  const localSubtotalMinor = Math.round(estimatedTotal * 100);
  const productSubtotalMinor = preview?.subtotal ?? localSubtotalMinor;
  const serviceChargeMinor = preview?.processing_fee_to_add ?? estimateServiceChargeMinor(productSubtotalMinor);
  const totalToPayMinor = productSubtotalMinor + serviceChargeMinor;

  useEffect(() => {
    if (!items.length) {
      setPreview(null);
      return;
    }

    const controller = new AbortController();

    async function loadPreview() {
      setIsPreviewing(true);
      setPreviewNotice('');
      try {
        const response = await fetch('/api/checkout/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            currency: 'GHS',
            fulfillment_type: 'PICKUP',
            delivery_address_id: null,
            items: checkoutItems
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Unable to confirm checkout total.');
        setPreview(data);
      } catch {
        if (controller.signal.aborted) return;
        setPreview(null);
        setPreviewNotice('Service charge is estimated here. Sedifex will confirm the final payment total at checkout.');
      } finally {
        if (!controller.signal.aborted) setIsPreviewing(false);
      }
    }

    loadPreview();
    return () => controller.abort();
  }, [checkoutItems, items.length]);

  const updateCustomer = (field: keyof CustomerForm, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    if (!customer.name.trim() || !customer.phone.trim()) {
      setError('Please enter your full name and phone number.');
      return;
    }

    if (!isValidPhone(customer.phone)) {
      setError('Please enter a valid phone number before payment.');
      return;
    }

    setIsCheckingOut(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'GHS',
          fulfillment_type: 'PICKUP',
          delivery_address_id: null,
          delivery_location: customer.deliveryLocation,
          note: customer.note,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            deliveryLocation: customer.deliveryLocation,
            note: customer.note
          },
          items: checkoutItems
        })
      });

      const data = (await response.json()) as CheckoutCreateResponse & { error?: string };
      if (!response.ok) throw new Error(data?.error || 'Checkout failed.');

      const paymentUrl = data.authorizationUrl || data.authorization_url || data.checkoutUrl || data.checkout_url || data.paymentUrl || data.payment_url || data.redirect_url;
      const reference = data.reference || data.payment_reference || data.order_reference || data.clientOrderId || data.client_order_id || data.order_id;
      const amountPaid = typeof data.amountPaid === 'number'
        ? data.amountPaid
        : typeof data.amount_paid === 'number'
          ? data.amount_paid
          : totalToPayMinor;

      window.sessionStorage.setItem(CHECKOUT_SNAPSHOT_KEY, JSON.stringify({
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        deliveryLocation: customer.deliveryLocation.trim(),
        reference,
        amountPaid,
        amount: amountPaid,
        currency: 'GHS',
        status: 'success'
      }));

      if (paymentUrl) {
        clearCart();
        window.location.href = paymentUrl;
        return;
      }

      if (reference) {
        clearCart();
        window.location.href = `/checkout/success?reference=${encodeURIComponent(reference)}`;
        return;
      }

      throw new Error('Sedifex created the order but did not return a payment link.');
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.');
      setIsCheckingOut(false);
    }
  };

  if (!items.length) {
    return (
      <section className='mx-auto max-w-3xl px-4 py-16 text-center md:px-6'>
        <div className='rounded-3xl border border-dashed border-stone-300 bg-white p-8 shadow-sm'>
          <h1 className='text-2xl font-semibold text-stone-900'>Your cart is empty</h1>
          <p className='mt-3 text-sm text-stone-600'>Add products to your cart before checkout.</p>
          <Link href='/shop' className='mt-6 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white'>Continue shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <section className='mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-6'>
      <div className='space-y-6'>
        <div>
          <p className='text-sm uppercase tracking-[0.2em] text-rose-500'>Checkout</p>
          <h1 className='mt-2 text-3xl font-semibold text-stone-900'>Review your cart</h1>
          <p className='mt-2 text-sm text-stone-600'>Your total includes products and the Paystack service charge only.</p>
        </div>

        <div className='space-y-3'>
          {items.map((item) => {
            const image = normalizeImageUrl(item.imageUrl);
            return (
              <div key={getCartItemKey(item)} className='grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm'>
                <div className='relative h-24 overflow-hidden rounded-xl bg-stone-100'>
                  <Image src={image} alt={item.name} fill className='object-cover' sizes='88px' />
                </div>
                <div className='space-y-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h2 className='font-semibold text-stone-900'>{item.name}</h2>
                      <p className='text-xs text-stone-500'>{item.storeName || item.category || 'Prep N Prime GH'}</p>
                      <p className='text-sm font-medium text-stone-800'>{formatGHS(item.price ?? undefined)} each</p>
                    </div>
                    <button type='button' onClick={() => removeItem(item)} className='text-xs font-medium text-rose-600'>Remove</button>
                  </div>
                  <div className='inline-flex items-center overflow-hidden rounded-full border border-stone-300 bg-white'>
                    <button type='button' onClick={() => updateQuantity(item, item.quantity - 1)} className='px-4 py-2 text-sm'>-</button>
                    <span className='min-w-10 text-center text-sm font-medium'>{item.quantity}</span>
                    <button type='button' onClick={() => updateQuantity(item, item.quantity + 1)} className='px-4 py-2 text-sm'>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className='space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:sticky md:top-28 md:self-start'>
        <div>
          <h2 className='text-xl font-semibold text-stone-900'>Customer details</h2>
          <p className='mt-1 text-sm text-stone-600'>{count} item{count === 1 ? '' : 's'} in cart.</p>
        </div>

        <div className='grid gap-4'>
          <input value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} placeholder='Full name *' className='rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-400' />
          <input value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder='Phone number *' className='rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-400' />
          <input value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} placeholder='Email address' className='rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-400' />
          <input value={customer.deliveryLocation} onChange={(event) => updateCustomer('deliveryLocation', event.target.value)} placeholder='Delivery location / landmark' className='rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-400' />
          <textarea value={customer.note} onChange={(event) => updateCustomer('note', event.target.value)} placeholder='Order note' rows={3} className='rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-400' />
        </div>

        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>Delivery fee is not charged now. After payment, the store will contact you and confirm delivery based on your location.</div>

        <div className='space-y-3 rounded-2xl bg-stone-50 p-4 text-sm'>
          <div className='flex justify-between'><span>Products subtotal</span><span className='font-semibold'>{formatMinorGHS(productSubtotalMinor)}</span></div>
          <div className='flex justify-between'><span>Paystack service charge</span><span>{isPreviewing ? 'Confirming...' : formatMinorGHS(serviceChargeMinor)}</span></div>
          <div className='border-t border-stone-200 pt-3 flex justify-between text-base font-semibold text-stone-900'><span>Total to pay</span><span>{formatMinorGHS(totalToPayMinor)}</span></div>
        </div>

        {previewNotice ? <p className='rounded-xl bg-stone-50 p-3 text-xs text-stone-600'>{previewNotice}</p> : null}
        {error ? <p className='rounded-xl bg-rose-50 p-3 text-sm text-rose-700'>{error}</p> : null}

        <button type='button' onClick={handleCheckout} disabled={isCheckingOut || isPreviewing} className='w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300'>
          {isCheckingOut ? 'Starting payment...' : 'Checkout with Paystack'}
        </button>
      </aside>
    </section>
  );
}
