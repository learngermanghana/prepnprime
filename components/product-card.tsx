'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AddToCartButton } from '@/components/cart-provider';
import { formatGHS } from '@/lib/format';
import { SedifexProduct } from '@/lib/types';
import { getStableProductSlug } from '@/lib/product-slug';

const fallback =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80';

function normalizeImageUrl(url?: string | null) {
  if (!url) return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://')) return `https://${trimmed.slice('http://'.length)}`;

  return encodeURI(trimmed);
}

export function ProductCard({ product }: { product: SedifexProduct }) {
  const imageSrc = useMemo(() => {
    const preferredImage = product.imageUrl || product.imageUrls?.find((candidate) => Boolean(candidate?.trim())) || fallback;
    return normalizeImageUrl(preferredImage);
  }, [product.imageUrl, product.imageUrls]);

  const [resolvedImageSrc, setResolvedImageSrc] = useState(imageSrc);
  useEffect(() => {
    setResolvedImageSrc(imageSrc);
  }, [imageSrc]);

  const slug = getStableProductSlug(product);
  const description = product.description || 'Premium skincare and body care essential.';
  const shouldTruncate = description.length > 120;
  const shortDescription = shouldTruncate ? `${description.slice(0, 120).trimEnd()}...` : description;

  return (
    <article className='overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm'>
      <div className='relative h-56 w-full'>
        <Image
          src={resolvedImageSrc}
          alt={product.imageAlt || `${product.name} product image`}
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, 33vw'
          onError={() => setResolvedImageSrc(fallback)}
        />
      </div>
      <div className='space-y-3 p-5'>
        <p className='text-xs uppercase tracking-[0.2em] text-rose-500'>{product.category || 'Beauty Care'}</p>
        <h3 className='text-lg font-semibold text-stone-900'>
          <Link href={`/shop/${slug}`} className='hover:underline'>
            {product.name}
          </Link>
        </h3>
        <p className='text-sm text-stone-600'>
          {shortDescription}
          {shouldTruncate && <span className='ml-1 font-medium text-stone-800'>Read more</span>}
        </p>
        <div className='flex items-center justify-between gap-3'>
          <span className='font-semibold text-stone-900'>{formatGHS(product.price)}</span>
          <div className='flex items-center gap-2'>
            <Link href={`/shop/${slug}`} className='rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-800'>
              View details
            </Link>
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}
