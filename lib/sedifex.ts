import { fallbackGallery, fallbackProducts, fallbackPromo } from '@/lib/fallback-data';
import { buildWhatsAppLink } from '@/lib/constants';
import type {
  IntegrationGalleryResponse,
  IntegrationProductsResponse,
  IntegrationPromoResponse,
  SedifexGalleryItem,
  SedifexProduct,
  SedifexPromo
} from '@/lib/types';

const baseUrl =
  process.env.SEDIFEX_API_BASE_URL ??
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ??
  'https://us-central1-sedifex-web.cloudfunctions.net';
const storeId =
  process.env.SEDIFEX_STORE_ID ??
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ??
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID;
const integrationKey =
  process.env.SEDIFEX_PRODUCTS_API_KEY ??
  process.env.SEDIFEX_INTEGRATION_API_KEY ??
  process.env.SEDIFEX_BOOKING_API_KEY ??
  process.env.SEDIFEX_INTEGRATION_KEY;
const contractVersion = process.env.SEDIFEX_CONTRACT_VERSION ?? '2026-04-13';

function buildHeaders() {
  if (!integrationKey) return undefined;

  return {
    'x-api-key': integrationKey,
    Authorization: `Bearer ${integrationKey}`,
    'X-Sedifex-Contract-Version': contractVersion,
    Accept: 'application/json'
  };
}

async function sedifexFetch<T>(endpoint: string): Promise<T | null> {
  const headers = buildHeaders();
  if (!baseUrl || !storeId || !headers) return null;

  const response = await fetch(`${baseUrl}${endpoint}?storeId=${encodeURIComponent(storeId)}`, {
    headers,
    next: { revalidate: 60 }
  });

  if (!response.ok) throw new Error(`Sedifex request failed: ${response.status}`);

  return (await response.json()) as T;
}

async function sedifexFetchMany<T>(endpoints: string[]): Promise<T | null> {
  for (const endpoint of endpoints) {
    try {
      const result = await sedifexFetch<T>(endpoint);
      if (result) return result;
    } catch {
      continue;
    }
  }

  return null;
}

function normalizePromoRecord(raw: unknown): SedifexPromo | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  const title = typeof candidate.title === 'string' ? candidate.title : undefined;
  if (!title) return null;

  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : undefined,
    slug: typeof candidate.slug === 'string' ? candidate.slug : undefined,
    title,
    summary: typeof candidate.summary === 'string' ? candidate.summary : undefined,
    startDate: typeof candidate.startDate === 'string' ? candidate.startDate : undefined,
    endDate: typeof candidate.endDate === 'string' ? candidate.endDate : undefined,
    websiteUrl: typeof candidate.websiteUrl === 'string' ? candidate.websiteUrl : null,
    imageUrl: typeof candidate.imageUrl === 'string' ? candidate.imageUrl : null,
    imageAlt: typeof candidate.imageAlt === 'string' ? candidate.imageAlt : null,
    phone: typeof candidate.phone === 'string' ? candidate.phone : undefined,
    storeName: typeof candidate.storeName === 'string' ? candidate.storeName : undefined,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined
  };
}

function normalizeGalleryItems(raw: unknown): SedifexGalleryItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.reduce<SedifexGalleryItem[]>((items, item) => {
    if (!item || typeof item !== 'object') return items;
    const record = item as Record<string, unknown>;
    const mediaRecord = record.media && typeof record.media === 'object' ? (record.media as Record<string, unknown>) : null;
    const url =
      (typeof record.url === 'string' ? record.url : undefined) ??
      (typeof record.imageUrl === 'string' ? record.imageUrl : undefined) ??
      (typeof record.image === 'string' ? record.image : undefined) ??
      (mediaRecord && typeof mediaRecord.url === 'string' ? mediaRecord.url : undefined);
    if (!url) return items;

    items.push({
      id: typeof record.id === 'string' ? record.id : undefined,
      url,
      alt: typeof record.alt === 'string' ? record.alt : undefined,
      caption: typeof record.caption === 'string' ? record.caption : undefined,
      sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : undefined,
      isPublished: typeof record.isPublished === 'boolean' ? record.isPublished : undefined,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined
    });

    return items;
  }, []);
}

function normalizeProductKey(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function getProductStatus(product: SedifexProduct) {
  const record = product as SedifexProduct & Record<string, unknown>;

  const status =
    typeof record.status === 'string'
      ? record.status
      : typeof record.publishStatus === 'string'
        ? record.publishStatus
        : typeof record.publicationStatus === 'string'
          ? record.publicationStatus
          : typeof record.state === 'string'
            ? record.state
            : '';

  return status.toLowerCase().trim();
}

function isDraftOrUnpublishedProduct(product: SedifexProduct) {
  const record = product as SedifexProduct & Record<string, unknown>;
  const status = getProductStatus(product);

  return (
    status === 'draft' ||
    status === 'unpublished' ||
    status === 'hidden' ||
    status === 'archived' ||
    record.isDraft === true ||
    record.isPublished === false ||
    record.published === false
  );
}

function isPublishedProduct(product: SedifexProduct) {
  const record = product as SedifexProduct & Record<string, unknown>;
  const status = getProductStatus(product);

  return (
    status === 'published' ||
    status === 'active' ||
    record.isPublished === true ||
    record.published === true
  );
}

function deduplicateProducts(products: SedifexProduct[]) {
  const map = new Map<string, SedifexProduct>();

  for (const product of products) {
    if (isDraftOrUnpublishedProduct(product)) continue;

    const key = [
      normalizeProductKey(product.storeId),
      normalizeProductKey(product.category),
      normalizeProductKey(product.name),
      product.price ?? ''
    ].join('|');

    const existing = map.get(key);

    if (!existing) {
      map.set(key, product);
      continue;
    }

    const productIsPublished = isPublishedProduct(product);
    const existingIsPublished = isPublishedProduct(existing);

    if (productIsPublished && !existingIsPublished) {
      map.set(key, product);
      continue;
    }

    const productTime = product.updatedAt ? Date.parse(product.updatedAt) : 0;
    const existingTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;

    if (productTime > existingTime) {
      map.set(key, product);
    }
  }

  return Array.from(map.values());
}

export function groupProductsByCategory(products: SedifexProduct[]) {
  return products.reduce<Record<string, SedifexProduct[]>>((acc, product) => {
    const category = product.category?.trim() || 'Uncategorized';
    acc[category] ??= [];
    acc[category].push(product);
    return acc;
  }, {});
}

export async function getSedifexProducts() {
  try {
    const result = await sedifexFetch<IntegrationProductsResponse>('/v1IntegrationProducts');
    const products = Array.isArray(result?.products) ? result.products : [];
    if (!products.length) return fallbackProducts;
    return deduplicateProducts(products);
  } catch {
    return fallbackProducts;
  }
}

export async function getSedifexPromo() {
  try {
    const result = await sedifexFetch<IntegrationPromoResponse>('/v1IntegrationPromo');
    const promo = normalizePromoRecord(result?.promo) ?? normalizePromoRecord(result);
    if (!promo) return fallbackPromo;
    return promo;
  } catch {
    return fallbackPromo;
  }
}

export async function getSedifexGallery() {
  try {
    const result = await sedifexFetchMany<IntegrationGalleryResponse | SedifexGalleryItem[]>([
      '/integrationGallery',
      '/v1IntegrationGallery'
    ]);
    const galleryPayload = Array.isArray(result)
      ? result
      : result && typeof result === 'object' && 'gallery' in result
        ? result.gallery
        : [];
    const gallery = normalizeGalleryItems(galleryPayload);
    if (!gallery.length) return fallbackGallery;

    return gallery
      .filter((item) => item.isPublished !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch {
    return fallbackGallery;
  }
}

export const getOrderLink = (productName: string) =>
  buildWhatsAppLink(`Hello Prep N Prime GH, I want to order ${productName}.`);
