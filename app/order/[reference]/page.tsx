import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata('Order status', 'Check your Prep N Prime GH order status.', '/order');

export default async function OrderStatusPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;

  return (
    <section className='mx-auto max-w-3xl px-4 py-16 text-center md:px-6'>
      <div className='rounded-3xl border border-stone-200 bg-white p-8 shadow-sm'>
        <PackageCheck className='mx-auto h-14 w-14 text-stone-900' />
        <h1 className='mt-5 text-3xl font-semibold text-stone-900'>Order status</h1>
        <p className='mt-3 text-stone-600'>Your order has been sent to Sedifex. Use this reference when contacting Prep N Prime GH.</p>
        <div className='mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700'>
          Reference: <span className='font-semibold text-stone-900'>{decodeURIComponent(reference)}</span>
        </div>
        <p className='mt-4 text-sm text-stone-500'>When Sedifex exposes the public order status endpoint for this store, this page can show live payment_status and order_status here.</p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Link href='/shop' className='rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white'>
            Shop again
          </Link>
          <Link href='/contact' className='rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-900'>
            Contact store
          </Link>
        </div>
      </div>
    </section>
  );
}
