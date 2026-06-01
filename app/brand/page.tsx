import { CollectionGrid } from '@/components/collection-grid';
import { ProductCard } from '@/components/product-card';
import { SectionHeading } from '@/components/section-heading';
import { buildPageMetadata } from '@/lib/metadata';
import { getSedifexProducts } from '@/lib/sedifex';

export const metadata = buildPageMetadata(
  'Brand',
  'Shop body care, skin care, and curated beauty collections from Prep N Prime GH in one place.',
  '/brand'
);

const brandKeywords = /body|lotion|oil|scrub|wash|cleanser|toner|serum|moisturizer|sunscreen|acne|hydration|glow|dark|sensitive|skin/i;

export default async function BrandPage() {
  const products = await getSedifexProducts();
  const filtered = products.filter((product) => brandKeywords.test(`${product.category} ${product.name}`));
  const displayProducts = filtered.length ? filtered : products;

  return (
    <div className='mx-auto max-w-7xl space-y-12 px-4 py-14 md:px-6'>
      <section className='rounded-3xl bg-[#fff5f7] p-8 md:p-12'>
        <SectionHeading
          eyebrow='Brand'
          title='Brand'
          description='Shop Body Care, Skin Care, and curated Collections together in one simple place.'
        />
      </section>

      <section>
        <SectionHeading
          title='Body Care & Skin Care Products'
          description='Explore lotions, oils, scrubs, cleansers, serums, moisturizers, sunscreen, glow products, and daily care essentials.'
        />
        <div className='mt-6 grid gap-5 md:grid-cols-3'>
          {displayProducts.map((product) => (
            <ProductCard key={`${product.id}-${product.name}`} product={product} />
          ))}
        </div>
      </section>

      <section className='space-y-6'>
        <SectionHeading title='Collections' description='Curated routines for glow, hydration, sensitive skin, body essentials, and daily care.' />
        <CollectionGrid />
      </section>
    </div>
  );
}
