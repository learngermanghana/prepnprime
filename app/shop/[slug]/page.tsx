import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductPurchasePanel } from '@/components/product-purchase-panel';
import { formatGHS } from '@/lib/format';
import { findProductBySlug, getStableProductSlug } from '@/lib/product-slug';
import { getSedifexProducts } from '@/lib/sedifex';

const fallbackImage =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80';

function resolveImage(url?: string | null) {
  if (!url?.trim()) return fallbackImage;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  return encodeURI(url);
}

export async function generateStaticParams() {
  const products = await getSedifexProducts();
  return products.map((product) => ({ slug: getStableProductSlug(product) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const products = await getSedifexProducts();
  const product = findProductBySlug(products, slug);
  if (!product) {
    return { title: 'Product not found | Prep N Prime GH' };
  }

  const description =
    product.description?.trim() || `${product.name} is available now from Prep N Prime GH at ${formatGHS(product.price)}.`;

  return {
    title: `${product.name} | Prep N Prime GH`,
    description: description.slice(0, 160),
    alternates: {
      canonical: `/shop/${slug}`
    },
    openGraph: {
      title: `${product.name} | Prep N Prime GH`,
      description: description.slice(0, 160),
      images: [{ url: resolveImage(product.imageUrl || product.imageUrls?.[0]) }],
      type: 'website'
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getSedifexProducts();
  const product = findProductBySlug(products, slug);

  if (!product) notFound();

  const image = resolveImage(product.imageUrl || product.imageUrls?.[0]);

  return (
    <section className='mx-auto max-w-6xl space-y-8 px-4 py-14 md:px-6'>
      <nav className='text-sm text-stone-500'>
        <Link href='/shop' className='hover:text-stone-900'>
          Shop
        </Link>{' '}
        / <span className='text-stone-800'>{product.name}</span>
      </nav>

      <article className='grid gap-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[1.1fr_0.9fr]'>
        <div className='space-y-5'>
          <div className='relative h-96 overflow-hidden rounded-xl bg-stone-100'>
            <Image src={image} alt={product.imageAlt || product.name} fill className='object-cover' sizes='(max-width: 768px) 100vw, 60vw' />
          </div>
          <div className='space-y-3'>
            <p className='text-xs uppercase tracking-[0.2em] text-rose-500'>{product.category || 'Beauty Care'}</p>
            <h1 className='text-3xl font-semibold text-stone-900'>{product.name}</h1>
            <p className='text-base leading-relaxed text-stone-700'>
              {product.description?.trim() || 'Premium skincare and body care essential from Prep N Prime GH.'}
            </p>
          </div>
        </div>
        <ProductPurchasePanel product={product} />
      </article>
    </section>
  );
}
