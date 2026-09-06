import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ActivityPopups } from '@/components/activity-popups';
import { CartProvider } from '@/components/cart-provider';
import { StructuredData } from '@/components/structured-data';
import { defaultMetadata } from '@/lib/metadata';
import './globals.css';

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <head>
        <StructuredData />
        <script
          async
          src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8991390842894141'
          crossOrigin='anonymous'
        />
      </head>
      <body>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <ActivityPopups />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
