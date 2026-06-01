import { NextResponse } from 'next/server';
import type { CheckoutPayload } from '@/lib/cart';
import type { CheckoutCreateResponse } from '@/lib/types';

const SEDIFEX_BASE_URL = process.env.SEDIFEX_API_BASE_URL ?? 'https://us-central1-sedifex-web.cloudfunctions.net';
const SEDIFEX_STORE_ID = process.env.SEDIFEX_STORE_ID;
const SEDIFEX_API_KEY = process.env.SEDIFEX_INTEGRATION_API_KEY ?? process.env.SEDIFEX_INTEGRATION_KEY;
const SEDIFEX_CONTRACT_VERSION = process.env.SEDIFEX_CONTRACT_VERSION ?? '2026-04-13';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.prepnprimegh.com';

function sedifexHeaders() {
  return {
    'x-api-key': SEDIFEX_API_KEY ?? '',
    Authorization: `Bearer ${SEDIFEX_API_KEY ?? ''}`,
    'X-Sedifex-Contract-Version': SEDIFEX_CONTRACT_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

function validatePayload(payload: CheckoutPayload) {
  if (!SEDIFEX_STORE_ID || !SEDIFEX_API_KEY) {
    return 'Sedifex checkout is not configured yet.';
  }

  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    return 'Cart is empty.';
  }

  if (!payload.customer?.name || !payload.customer?.phone) {
    return 'Customer name and phone number are required.';
  }

  const invalidItem = payload.items.find((item) => !item.item_id || !Number.isInteger(item.qty) || item.qty < 1);
  if (invalidItem) return 'Cart contains an invalid item.';

  return null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;
    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const url = new URL('/integration/checkout/create', SEDIFEX_BASE_URL);

    const response = await fetch(url, {
      method: 'POST',
      headers: sedifexHeaders(),
      cache: 'no-store',
      body: JSON.stringify({
        merchant_id: SEDIFEX_STORE_ID,
        storeId: SEDIFEX_STORE_ID,
        currency: payload.currency ?? 'GHS',
        fulfillment_type: payload.fulfillment_type ?? 'PICKUP',
        delivery_address_id: payload.delivery_address_id ?? null,
        delivery_location: payload.delivery_location,
        customer: payload.customer,
        note: payload.note,
        items: payload.items,
        sourceChannel: 'client_website',
        success_url: `${SITE_URL}/checkout/success`,
        failed_url: `${SITE_URL}/checkout/failed`,
        attributes: {
          source: 'website_checkout'
        }
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || `Sedifex checkout create failed: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data as CheckoutCreateResponse);
  } catch {
    return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 });
  }
}
