import { getStableProductSlug } from '@/lib/product-slug';
import type { SedifexProduct } from '@/lib/types';

export type CartItemType = 'PRODUCT' | 'SERVICE';

export type CartItem = {
  id: string;
  type: CartItemType;
  name: string;
  price?: number;
  imageUrl?: string | null;
  category?: string | null;
  quantity: number;
  slug?: string;
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
  qty: number;
};

export type CheckoutPayload = {
  currency: 'GHS';
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  delivery_address_id?: string | null;
  delivery_location?: string;
  customer?: CartCustomer;
  note?: string;
  items: CheckoutCartItemInput[];
};

export function getCartItemType(product: SedifexProduct): CartItemType {
  const extraType = 'type' in product && typeof product.type === 'string' ? product.type : '';
  const rawType = `${product.itemType ?? ''} ${extraType}`.toLowerCase();
  return rawType.includes('service') ? 'SERVICE' : 'PRODUCT';
}

export function cartItemFromProduct(product: SedifexProduct, quantity = 1): CartItem {
  const slug = getStableProductSlug(product);

  return {
    id: product.id || slug,
    type: getCartItemType(product),
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl || product.imageUrls?.[0] || null,
    category: product.category,
    quantity,
    slug
  };
}

export function toCheckoutItems(items: CartItem[]): CheckoutCartItemInput[] {
  return items.map((item) => ({
    type: item.type,
    item_id: item.id,
    qty: item.quantity
  }));
}

export function getCartItemKey(item: Pick<CartItem, 'type' | 'id'>) {
  return `${item.type}:${item.id}`;
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartEstimatedTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);
}
