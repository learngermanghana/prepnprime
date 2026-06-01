export type SedifexProduct = {
  id?: string;
  storeId?: string;
  storeName?: string;
  name: string;
  category?: string | null;
  description?: string | null;
  price?: number;
  stockCount?: number;
  itemType?: string;
  type?: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  imageAlt?: string;
  updatedAt?: string;
};

export type SedifexPromo = {
  enabled?: boolean;
  slug?: string;
  title?: string;
  summary?: string;
  startDate?: string;
  endDate?: string;
  websiteUrl?: string | null;
  youtubeUrl?: string | null;
  youtubeEmbedUrl?: string | null;
  youtubeChannelId?: string | null;
  youtubeVideos?: string[];
  imageUrl?: string | null;
  imageAlt?: string | null;
  phone?: string;
  storeName?: string;
  updatedAt?: string;
};

export type SedifexGalleryItem = {
  id?: string;
  url?: string;
  alt?: string;
  caption?: string;
  sortOrder?: number;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type IntegrationProductsResponse = {
  products?: SedifexProduct[];
};

export type IntegrationPromoResponse = {
  promo?: SedifexPromo;
  storeId?: string;
};

export type IntegrationGalleryResponse = {
  gallery?: SedifexGalleryItem[];
  storeId?: string;
};

export type CheckoutBreakdownLine = {
  code: string;
  amount: number;
};

export type CheckoutPreviewResponse = {
  pricing_version?: string;
  subtotal: number;
  tax_total: number;
  delivery_fee: number;
  pre_processing_total: number;
  processing_fee_to_add: number;
  final_total: number;
  breakdown?: CheckoutBreakdownLine[];
  pricing_snapshot?: unknown;
};

export type CheckoutCreateResponse = CheckoutPreviewResponse & {
  order_id?: string;
  order_reference?: string;
  payment_reference?: string;
  payment_status?: string;
  order_status?: string;
  checkout_url?: string;
  checkoutUrl?: string;
  payment_url?: string;
  paymentUrl?: string;
  redirect_url?: string;
  authorizationUrl?: string;
  authorization_url?: string;
  reference?: string;
  clientOrderId?: string;
  client_order_id?: string;
  amountPaid?: number;
  amount_paid?: number;
};
