import Link from 'next/link';
import { CheckCircle2, MessageCircleMore, PackageCheck } from 'lucide-react';
import { buildWhatsAppLink, PHONE_DISPLAY } from '@/lib/constants';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata('Order successful', 'Your Prep N Prime GH order has been received.', '/checkout/success');

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  const whatsappMessage = reference
    ? `Hello Prep N Prime GH, I have placed an order with reference ${reference}. Please help me confirm it.`
    : 'Hello Prep N Prime GH, I have placed an order on your website. Please help me confirm it.';

  return (
    <section className='mx-auto max-w-3xl px-4 py-16 text-center md:px-6'>
      <div className='rounded-3xl border border-stone-200 bg-white p-8 shadow-sm'>
        <CheckCircle2 className='mx-auto h-14 w-14 text-emerald-600' />
        <h1 className='mt-5 text-3xl font-semibold text-stone-900'>Order received successfully</h1>
        <p className='mt-3 text-stone-600'>Thank you. Sedifex has received your order and payment details.</p>

        <div className='mt-6 rounded-2xl bg-emerald-50 p-5 text-left'>
          <div className='flex gap-3'>
            <PackageCheck className='mt-1 h-5 w-5 shrink-0 text-emerald-700' />
            <div>
              <h2 className='font-semibold text-stone-900'>Our team is processing your order</h2>
              <p className='mt-1 text-sm leading-6 text-stone-700'>
                Please keep your phone available. A Prep N Prime GH team member may contact you to confirm pickup, delivery, or any extra order details.
              </p>
            </div>
          </div>
        </div>

        {reference ? (
          <div className='mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700'>
            Order reference: <span className='font-semibold text-stone-900'>{reference}</span>
          </div>
        ) : null}

        <div className='mt-5 rounded-2xl border border-stone-200 bg-[#fffdfa] p-5'>
          <p className='text-sm font-medium text-stone-900'>Need help with your order?</p>
          <p className='mt-1 text-sm text-stone-600'>Contact us on WhatsApp: <span className='font-semibold text-stone-900'>{PHONE_DISPLAY}</span></p>
          <a
            href={buildWhatsAppLink(whatsappMessage)}
            target='_blank'
            rel='noreferrer'
            className='mt-4 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white'
          >
            <MessageCircleMore className='h-4 w-4' /> Contact us on WhatsApp
          </a>
        </div>

        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          {reference ? (
            <Link href={`/order/${encodeURIComponent(reference)}`} className='rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-900'>
              View order status
            </Link>
          ) : null}
          <Link href='/shop' className='rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-900'>
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
