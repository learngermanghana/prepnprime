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

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSedifexItemId(rawId: string, storeId: string) {
  const id = rawId.trim();
  const storePrefix = `${storeId}_`;
  return storeId && id.startsWith(storePrefix) ? id.slice(storePrefix.length) : id;
}

function getAmountMajor(payload: CheckoutPayload) {
  const directAmount = numberValue(payload.amount ?? payload.totalAmount ?? payload.total_amount);
  if (directAmount && directAmount > 0) return directAmount;

  const snapshot = payload.pricing_snapshot && typeof payload.pricing_snapshot === 'object'
    ? payload.pricing_snapshot as Record<string, unknown>
    : {};
  const finalTotalMinor = numberValue(snapshot.final_total);
  if (finalTotalMinor && finalTotalMinor > 0) return finalTotalMinor / 100;

  return null;
}

function buildCheckoutBody(payload: CheckoutPayload) {
  const storeId = SEDIFEX_STORE_ID as string;
  const clientOrderId = `PREP-PAY-${Date.now()}`;
  const amountMajor = getAmountMajor(payload);
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
    payment_reference: clientOrderId,
    reference: clientOrderId,
    sourceChannel: 'client_website',
    source_channel: 'client_website',
    sourceLabel: 'Prep N Prime GH Website',
    source_label: 'Prep N Prime GH Website',
    orderType: 'product',
    currency: payload.currency ?? 'GHS',
    amount: amountMajor,
    totalAmount: amountMajor,
    total_amount: amountMajor,
    servicePrice: amountMajor,
    service_price: amountMajor,
    pricing_snapshot: payload.pricing_snapshot,
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
    customerEmail: payload.customer?.email,
    customer_email: payload.customer?.email,
    customerName: payload.customer?.name,
    customer_name: payload.customer?.name,
    customerPhone: payload.customer?.phone,
    customer_phone: payload.customer?.phone,
    email: payload.customer?.email,
    name: payload.customer?.name,
    phone: payload.customer?.phone,
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
  if (!payload.customer?.email) return 'Customer email is required.';
  if (!isValidPhone(payload.customer.phone)) return 'Please enter a valid phone number.';
  if (!getAmountMajor(payload)) return 'Checkout amount is required.';
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
