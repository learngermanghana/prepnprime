import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata('Payment failed', 'Your Prep N Prime GH payment could not be completed.', '/checkout/failed');

export default function CheckoutFailedPage() {
  return (
    <section className='mx-auto max-w-3xl px-4 py-16 text-center md:px-6'>
      <div className='rounded-3xl border border-stone-200 bg-white p-8 shadow-sm'>
        <AlertCircle className='mx-auto h-14 w-14 text-rose-600' />
        <h1 className='mt-5 text-3xl font-semibold text-stone-900'>Payment was not completed</h1>
        <p className='mt-3 text-stone-600'>Your order payment did not go through. You can return to checkout and try again.</p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Link href='/checkout' className='rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white'>
            Try checkout again
          </Link>
          <Link href='/shop' className='rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-900'>
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
