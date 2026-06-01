import { NextResponse } from 'next/server';
import type { CheckoutPayload } from '@/lib/cart';
import type { CheckoutCreateResponse } from '@/lib/types';

const SEDIFEX_BASE_URL =
  process.env.SEDIFEX_API_BASE_URL ??
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ??
  'https://us-central1-sedifex-web.cloudfunctions.net';
const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_CHECKOUT_STORE_ID ??
  process.env.SEDIFEX_STORE_ID ??
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ??
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID;
const SEDIFEX_API_KEY =
  process.env.SEDIFEX_CHECKOUT_API_KEY ??
  process.env.SEDIFEX_INTEGRATION_API_KEY ??
  process.env.SEDIFEX_PRODUCTS_API_KEY ??
  process.env.SEDIFEX_BOOKING_API_KEY ??
  process.env.SEDIFEX_INTEGRATION_KEY;
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

function isValidPhone(value?: string) {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length >= 9 && digits.length <= 15;
}

function normalizeSedifexItemId(rawId: string, storeId: string) {
  const id = rawId.trim();
  const storePrefix = `${storeId}_`;
  return storeId && id.startsWith(storePrefix) ? id.slice(storePrefix.length) : id;
}

function buildCheckoutBody(payload: CheckoutPayload) {
  const storeId = SEDIFEX_STORE_ID as string;
  const clientOrderId = `PREP-PAY-${Date.now()}`;
  const cart = payload.items.map((item) => {
    const productId = normalizeSedifexItemId(item.item_id, storeId);
    return {
      productId,
      item_id: productId,
      originalProductId: item.item_id,
      merchantId: storeId,
      merchant_id: storeId,
      storeId,
      store_id: storeId,
      quantity: item.qty,
      qty: item.qty,
      type: item.type,
      item_type: item.type.toLowerCase()
    };
  });
  const items = cart.map((item) => ({
    id: item.productId,
    item_id: item.productId,
    productId: item.productId,
    originalProductId: item.originalProductId,
    merchantId: item.merchantId,
    merchant_id: item.merchant_id,
    storeId: item.storeId,
    store_id: item.store_id,
    qty: item.qty,
    quantity: item.quantity,
    type: item.type,
    item_type: item.item_type
  }));

  return {
    storeId,
    store_id: storeId,
    merchantId: storeId,
    merchant_id: storeId,
    clientOrderId,
    client_order_id: clientOrderId,
    sourceChannel: 'client_website',
    source_channel: 'client_website',
    sourceLabel: 'Prep N Prime GH Website',
    source_label: 'Prep N Prime GH Website',
    orderType: 'product',
    currency: payload.currency ?? 'GHS',
    fulfillment_type: 'PICKUP',
    delivery_address_id: null,
    delivery_fee: 0,
    tax_total: 0,
    charge_processing_fee_to_customer: true,
    add_processing_fee_to_customer: true,
    processing_fee_payer: 'customer',
    cart,
    items,
    customer: payload.customer,
    delivery: {
      location: payload.delivery_location ?? payload.customer?.deliveryLocation ?? '',
      notes: payload.note ?? payload.customer?.note ?? '',
      feeMode: 'after_payment',
      message: 'Delivery fee will be confirmed after payment based on customer location.'
    },
    delivery_location: payload.delivery_location,
    note: payload.note,
    returnUrl: `${SITE_URL}/checkout/success`,
    cancelUrl: `${SITE_URL}/checkout/failed`,
    success_url: `${SITE_URL}/checkout/success`,
    failed_url: `${SITE_URL}/checkout/failed`,
    syncStatus: 'pending',
    syncRequestedAt: new Date().toISOString(),
    attributes: {
      source: 'website_checkout',
      deliveryFeeMode: 'after_payment',
      processingFeePayer: 'customer'
    }
  };
}

function validatePayload(payload: CheckoutPayload) {
  if (!SEDIFEX_STORE_ID || !SEDIFEX_API_KEY) return 'Sedifex checkout is not configured yet.';
  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) return 'Cart is empty.';
  if (!payload.customer?.name || !payload.customer?.phone) return 'Customer name and phone number are required.';
  if (!isValidPhone(payload.customer.phone)) return 'Please enter a valid phone number.';
  const invalidItem = payload.items.find((item) => !item.item_id || !Number.isInteger(item.qty) || item.qty < 1);
  if (invalidItem) return 'Cart contains an invalid item.';
  return null;
}

async function postToSedifex(endpoint: string, body: ReturnType<typeof buildCheckoutBody>) {
  const url = new URL(endpoint, SEDIFEX_BASE_URL);
  const response = await fetch(url, {
    method: 'POST',
    headers: sedifexHeaders(),
    cache: 'no-store',
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;
    const validationError = validatePayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const body = buildCheckoutBody(payload);
    const primary = await postToSedifex('/integrationCheckoutCreate', body);
    const result = primary.response.status === 404 ? await postToSedifex('/integration/checkout/create', body) : primary;

    if (!result.response.ok) {
      return NextResponse.json(
        { error: result.data?.error || result.data?.message || `Sedifex checkout create failed: ${result.response.status}` },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data as CheckoutCreateResponse);
  } catch {
    return NextResponse.json({ error: 'Checkout failed.' }, { status: 500 });
  }
}
