'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { formatGHS } from '@/lib/format';
import {
  CartItem,
  cartItemFromProduct,
  getCartCount,
  getCartEstimatedTotal,
  getCartItemKey
} from '@/lib/cart';
import type { SedifexProduct } from '@/lib/types';

const CART_STORAGE_KEY = 'prepnprime-cart-v1';
const fallbackImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80';

type CartContextValue = {
  items: CartItem[];
  count: number;
  estimatedTotal: number;
  isCartOpen: boolean;
  addProduct: (product: SedifexProduct, quantity?: number, openCart?: boolean) => void;
  addItem: (item: CartItem, openCart?: boolean) => void;
  updateQuantity: (item: CartItem, quantity: number) => void;
  removeItem: (item: CartItem) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeImageUrl(url?: string | null) {
  if (!url?.trim()) return fallbackImage;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  return encodeURI(url);
}

function formatCartPrice(value?: number | null) {
  return formatGHS(value ?? undefined);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed.filter((item) => item?.id && item?.name && item?.quantity));
      }
    } catch {
      setItems([]);
    } finally {
      setHasLoadedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCart) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasLoadedCart, items]);

  const count = getCartCount(items);
  const estimatedTotal = getCartEstimatedTotal(items);

  const addItem = (nextItem: CartItem, openCart = true) => {
    setItems((current) => {
      const itemKey = getCartItemKey(nextItem);
      const existing = current.find((item) => getCartItemKey(item) === itemKey);
      if (!existing) return [...current, { ...nextItem, quantity: Math.max(1, nextItem.quantity) }];

      return current.map((item) =>
        getCartItemKey(item) === itemKey
          ? { ...item, quantity: item.quantity + Math.max(1, nextItem.quantity) }
          : item
      );
    });

    if (openCart) setIsCartOpen(true);
  };

  const value = useMemo<CartContextValue>(() => ({
    items,
    count,
    estimatedTotal,
    isCartOpen,
    addProduct: (product, quantity = 1, openCart = true) => addItem(cartItemFromProduct(product, quantity), openCart),
    addItem,
    updateQuantity: (targetItem, quantity) => {
      setItems((current) => {
        if (quantity <= 0) return current.filter((item) => getCartItemKey(item) !== getCartItemKey(targetItem));
        return current.map((item) =>
          getCartItemKey(item) === getCartItemKey(targetItem) ? { ...item, quantity } : item
        );
      });
    },
    removeItem: (targetItem) => setItems((current) => current.filter((item) => getCartItemKey(item) !== getCartItemKey(targetItem))),
    clearCart: () => setItems([]),
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false)
  }), [count, estimatedTotal, isCartOpen, items]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
      <MobileFloatingCart />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

export function CartButton({ compact = false }: { compact?: boolean }) {
  const { count, estimatedTotal, openCart } = useCart();

  return (
    <button
      type='button'
      onClick={openCart}
      className='inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-sm transition hover:border-stone-900'
      aria-label='Open cart'
    >
      <ShoppingBag className='h-4 w-4' />
      <span>Cart ({count})</span>
      {!compact && count > 0 ? <span className='hidden text-stone-500 lg:inline'>· {formatGHS(estimatedTotal)}</span> : null}
    </button>
  );
}

export function AddToCartButton({ product, quantity = 1, label }: { product: SedifexProduct; quantity?: number; label?: string }) {
  const { addProduct } = useCart();
  const isService = `${product.itemType ?? ''} ${product.type ?? ''}`.toLowerCase().includes('service');

  return (
    <button
      type='button'
      onClick={() => addProduct(product, quantity)}
      className='rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-700'
    >
      {label ?? (isService ? 'Add service' : 'Add to cart')}
    </button>
  );
}

function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const image = normalizeImageUrl(item.imageUrl);

  return (
    <div className='grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-stone-200 bg-white p-3'>
      <div className='relative h-20 overflow-hidden rounded-xl bg-stone-100'>
        <Image src={image} alt={item.name} fill className='object-cover' sizes='72px' />
      </div>
      <div className='space-y-2'>
        <div>
          <p className='text-sm font-semibold text-stone-900'>{item.name}</p>
          <p className='text-xs text-stone-500'>{item.storeName || item.category || 'Prep N Prime GH'}</p>
          <p className='text-xs font-medium text-stone-800'>{formatCartPrice(item.price)} each</p>
        </div>
        <div className='flex items-center justify-between gap-3'>
          <div className='inline-flex items-center overflow-hidden rounded-full border border-stone-300'>
            <button type='button' onClick={() => updateQuantity(item, item.quantity - 1)} className='px-3 py-1 text-sm'>-</button>
            <span className='min-w-8 text-center text-sm'>{item.quantity}</span>
            <button type='button' onClick={() => updateQuantity(item, item.quantity + 1)} className='px-3 py-1 text-sm'>+</button>
          </div>
          <button type='button' onClick={() => removeItem(item)} className='inline-flex items-center gap-1 text-xs font-medium text-rose-600'>
            <Trash2 className='h-3.5 w-3.5' /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer() {
  const { items, count, estimatedTotal, isCartOpen, closeCart } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className='fixed inset-0 z-[80]'>
      <button type='button' aria-label='Close cart overlay' className='absolute inset-0 bg-stone-950/40' onClick={closeCart} />
      <aside className='absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffdfa] shadow-2xl'>
        <div className='flex items-center justify-between border-b border-stone-200 p-5'>
          <div>
            <h2 className='text-lg font-semibold text-stone-900'>Your cart</h2>
            <p className='text-sm text-stone-500'>{count} item{count === 1 ? '' : 's'} · {formatGHS(estimatedTotal)}</p>
          </div>
          <button type='button' onClick={closeCart} className='rounded-full border border-stone-200 p-2 text-stone-700'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='flex-1 space-y-3 overflow-y-auto p-5'>
          {items.length ? items.map((item) => <CartLineItem key={getCartItemKey(item)} item={item} />) : (
            <div className='rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600'>
              Your cart is empty. Add products before checkout.
            </div>
          )}
        </div>

        <div className='space-y-3 border-t border-stone-200 p-5'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-stone-600'>Estimated subtotal</span>
            <span className='font-semibold text-stone-900'>{formatGHS(estimatedTotal)}</span>
          </div>
          <p className='text-xs text-stone-500'>Final total is confirmed securely with Sedifex before payment.</p>
          <Link
            href='/checkout'
            onClick={closeCart}
            className={`block rounded-full px-5 py-3 text-center text-sm font-semibold text-white ${items.length ? 'bg-stone-900' : 'pointer-events-none bg-stone-300'}`}
          >
            Checkout with Paystack
          </Link>
          <Link href='/shop' onClick={closeCart} className='block text-center text-sm font-medium text-rose-600'>Continue shopping</Link>
        </div>
      </aside>
    </div>
  );
}

function MobileFloatingCart() {
  const { count, estimatedTotal, openCart } = useCart();
  if (count < 1) return null;

  return (
    <button
      type='button'
      onClick={openCart}
      className='fixed bottom-4 left-4 right-4 z-50 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-xl md:hidden'
    >
      Cart {count} · {formatGHS(estimatedTotal)}
    </button>
  );
}
