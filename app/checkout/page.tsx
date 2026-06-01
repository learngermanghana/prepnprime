import { CheckoutClient } from '@/components/checkout-client';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata('Checkout', 'Review your Prep N Prime GH cart and checkout securely.', '/checkout');

export default function CheckoutPage() {
  return <CheckoutClient />;
}
