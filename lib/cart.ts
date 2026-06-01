import { getStableProductSlug } from '@/lib/product-slug';
import type { SedifexProduct } from '@/lib/types';

export type CartItemType = 'PRODUCT' | 'SERVICE';

export type CartItem = {
  id: string;
  productId: string;
  merchantId: string;
  type: CartItemType;
  name: string;
  productName: string;
  price?: number | null;
  currency?: string;
  imageUrl?: string | null;
  category?: string | null;
  quantity: number;
  slug?: string;
  storeName?: string;
};

export type CartCustomer = {
  name: string;
  email?: string;
  phone?: string;
  deliveryLocation?: string;
  note?: string;
};

export type CheckoutCartItemInput = {
  type: CartItemType;
  item_id: string;
  productId?: string;
  merchantId?: string;
  qty: number;
};

export type CheckoutPayload = {
  currency: 'GHS';
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  delivery_address_id?: string | null;
  delivery_location?: string;
  customer?: CartCustomer;
  note?: string;
  amount?: number;
  totalAmount?: number;
  total_amount?: number;
  pricing_snapshot?: unknown;
  items: CheckoutCartItemInput[];
};

export function getCartItemType(product: SedifexProduct): CartItemType {
  const extraType = 'type' in product && typeof product.type === 'string' ? product.type : '';
  const rawType = `${product.itemType ?? ''} ${extraType}`.toLowerCase();
  return rawType.includes('service') ? 'SERVICE' : 'PRODUCT';
}

export function cartItemFromProduct(product: SedifexProduct, quantity = 1): CartItem {
  const slug = getStableProductSlug(product);
  const productId = product.id || slug;
  const merchantId = product.storeId || 'default-store';

  return {
    id: productId,
    productId,
    merchantId,
    type: getCartItemType(product),
    name: product.name,
    productName: product.name,
    price: product.price,
    currency: 'GHS',
    imageUrl: product.imageUrl || product.imageUrls?.[0] || null,
    category: product.category,
    quantity,
    slug,
    storeName: product.storeName || 'Prep N Prime GH'
  };
}

export function toCheckoutItems(items: CartItem[]): CheckoutCartItemInput[] {
  return items.map((item) => ({
    type: item.type,
    item_id: item.productId || item.id,
    productId: item.productId || item.id,
    merchantId: item.merchantId,
    qty: item.quantity
  }));
}

export function getCartItemKey(item: Pick<CartItem, 'type' | 'id'> & Partial<Pick<CartItem, 'merchantId' | 'productId'>>) {
  return `${item.merchantId ?? 'default-store'}:${item.productId ?? item.id}:${item.type}`;
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartEstimatedTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);
}
