'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { formatGHS } from '@/lib/format';
import type { SedifexProduct } from '@/lib/types';

export function ProductPurchasePanel({ product }: { product: SedifexProduct }) {
  const [quantity, setQuantity] = useState(1);
  const { addProduct } = useCart();

  const addCurrentProduct = (openCart = true) => addProduct(product, quantity, openCart);

  return (
    <div className='space-y-5 rounded-2xl border border-stone-200 bg-[#fffdfa] p-5 shadow-sm md:sticky md:top-28'>
      <div>
        <p className='text-sm text-stone-500'>Price</p>
        <p className='text-2xl font-semibold text-stone-900'>{formatGHS(product.price)}</p>
      </div>

      <div className='space-y-2'>
        <p className='text-sm font-medium text-stone-700'>Quantity</p>
        <div className='inline-flex items-center overflow-hidden rounded-full border border-stone-300 bg-white'>
          <button type='button' onClick={() => setQuantity((value) => Math.max(1, value - 1))} className='px-4 py-2 text-sm'>-</button>
          <span className='min-w-10 text-center text-sm font-medium'>{quantity}</span>
          <button type='button' onClick={() => setQuantity((value) => value + 1)} className='px-4 py-2 text-sm'>+</button>
        </div>
      </div>

      <div className='grid gap-3'>
        <button
          type='button'
          onClick={() => addCurrentProduct(true)}
          className='rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700'
        >
          Add to cart
        </button>
        <Link
          href='/checkout'
          onClick={() => addCurrentProduct(false)}
          className='rounded-full border border-stone-300 bg-white px-6 py-3 text-center text-sm font-semibold text-stone-900 transition hover:border-stone-900'
        >
          Checkout now
        </Link>
      </div>

      <p className='text-xs text-stone-500'>Checkout now adds this item to your cart first, then lets you review your order before payment.</p>
    </div>
  );
}
