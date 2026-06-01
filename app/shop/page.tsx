import { SectionHeading } from '@/components/section-heading';
import { ShopCatalog } from '@/components/shop-catalog';
import { buildPageMetadata } from '@/lib/metadata';
import { getSedifexProducts } from '@/lib/sedifex';

export const metadata = buildPageMetadata('Shop', 'Browse premium body care and skincare products in Ghana.', '/shop');

export default async function ShopPage() {
  const products = await getSedifexProducts();

  return (
    <section className='mx-auto max-w-7xl space-y-10 px-4 py-14 md:px-6'>
      <SectionHeading title='Shop All Products' description='Browse the full Prep N Prime GH catalog, add items to cart, and checkout securely.' />
      <ShopCatalog products={products} />
    </section>
  );
}
