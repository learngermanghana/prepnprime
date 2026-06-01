import Link from 'next/link';
import { MessageCircleMore } from 'lucide-react';
import { BRAND_NAME, NAV_LINKS, WHATSAPP_LINK } from '@/lib/constants';
import { CartButton } from '@/components/cart-provider';
import { MobileNav } from '@/components/mobile-nav';

export function SiteHeader() {
  return (
    <header className='sticky top-0 z-50 border-b border-stone-200 bg-[#fefbf8]/95 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6'>
        <Link href='/' className='text-lg font-semibold text-stone-900'>
          {BRAND_NAME}
        </Link>
        <nav className='hidden items-center gap-5 md:flex'>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className='text-sm text-stone-700 transition hover:text-stone-900'>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className='hidden items-center gap-3 md:flex'>
          <CartButton />
          <a
            href={WHATSAPP_LINK}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white'
          >
            <MessageCircleMore className='h-4 w-4' /> WhatsApp
          </a>
        </div>
        <div className='flex items-center gap-2 md:hidden'>
          <CartButton compact />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
