'use client';

export function NewsletterBox() {
  return (
    <div className='rounded-2xl border border-stone-200 bg-white p-6'>
      <h3 className='text-lg font-semibold text-stone-900'>Join our customer promo list</h3>
      <p className='mt-2 text-sm text-stone-600'>Click the link below to join the customer list and get promo updates.</p>
      <a
        href='https://sedifex.com/join-customers/37mJqg20MjOriggaIaOOuahDsgj1'
        target='_blank'
        rel='noreferrer'
        className='mt-4 inline-flex rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white'
      >
        Join customer list
      </a>
    </div>
  );
}
