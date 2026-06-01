import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata('Order successful', 'Your Prep N Prime GH order has been received.', '/checkout/success');

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;

  return (
    <section className='mx-auto max-w-3xl px-4 py-16 text-center md:px-6'>
      <div className='rounded-3xl border border-stone-200 bg-white p-8 shadow-sm'>
        <CheckCircle2 className='mx-auto h-14 w-14 text-emerald-600' />
        <h1 className='mt-5 text-3xl font-semibold text-stone-900'>Order received</h1>
        <p className='mt-3 text-stone-600'>Thank you. Sedifex has received your order and payment details.</p>
        {reference ? (
          <div className='mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700'>
            Order reference: <span className='font-semibold text-stone-900'>{reference}</span>
          </div>
        ) : null}
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          {reference ? (
            <Link href={`/order/${encodeURIComponent(reference)}`} className='rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white'>
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
