export type SedifexBlogPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  contentHtml?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
  tags?: string[];
};

export type SedifexBlogResponse = {
  items?: SedifexBlogPost[];
  posts?: SedifexBlogPost[];
  post?: SedifexBlogPost;
  item?: SedifexBlogPost;
  data?: SedifexBlogPost | SedifexBlogPost[];
  nextCursor?: string | null;
};

const SEDIFEX_BLOG_BASE_URL = 'https://www.sedifex.com';
const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_STORE_ID ??
  process.env.SEDIFEX_CHECKOUT_STORE_ID ??
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ??
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID;

export const fallbackBlogPosts: SedifexBlogPost[] = [
  {
    title: 'How to Choose the Right Skincare Products in Accra',
    slug: 'how-to-choose-skincare-products-accra',
    excerpt: 'A simple guide to choosing skincare products for your skin type, routine, and Accra weather.',
    coverImageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Skincare products arranged on a clean surface',
    publishedAt: new Date().toISOString(),
    contentHtml:
      '<p>Choosing the right skincare products starts with understanding your skin type and your main concern. For dry skin, look for gentle cleansers and moisturizers. For dark spots or uneven tone, ask for guidance before combining active ingredients.</p><p>Prep N Prime GH helps customers in Haatso, Accra, East Legon, Airport, Madina and nearby areas shop authentic beauty, skincare and body care products with friendly support.</p>'
  }
];

function getBlogUrl(slug?: string) {
  const url = new URL('/api/public-blog', SEDIFEX_BLOG_BASE_URL);
  if (SEDIFEX_STORE_ID) url.searchParams.set('storeId', SEDIFEX_STORE_ID);
  if (slug) url.searchParams.set('slug', slug);
  return url;
}

function normalizePost(raw: unknown): SedifexBlogPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title : '';
  const slug = typeof record.slug === 'string'
    ? record.slug
    : typeof record.postSlug === 'string'
      ? record.postSlug
      : '';

  if (!title || !slug) return null;

  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    title,
    slug,
    excerpt: typeof record.excerpt === 'string' ? record.excerpt : null,
    coverImageUrl: typeof record.coverImageUrl === 'string'
      ? record.coverImageUrl
      : typeof record.imageUrl === 'string'
        ? record.imageUrl
        : null,
    coverImageAlt: typeof record.coverImageAlt === 'string'
      ? record.coverImageAlt
      : typeof record.imageAlt === 'string'
        ? record.imageAlt
        : title,
    contentHtml: typeof record.contentHtml === 'string'
      ? record.contentHtml
      : typeof record.html === 'string'
        ? record.html
        : null,
    publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : null,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : null,
    authorName: typeof record.authorName === 'string' ? record.authorName : null,
    tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === 'string') : []
  };
}

function getPostsFromPayload(payload: unknown): SedifexBlogPost[] {
  if (Array.isArray(payload)) return payload.map(normalizePost).filter((post): post is SedifexBlogPost => Boolean(post));
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as SedifexBlogResponse;
  const source = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.posts)
      ? record.posts
      : Array.isArray(record.data)
        ? record.data
        : [];

  return source.map(normalizePost).filter((post): post is SedifexBlogPost => Boolean(post));
}

function getPostFromPayload(payload: unknown, slug?: string): SedifexBlogPost | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as SedifexBlogResponse;

  const direct = normalizePost(record.post ?? record.item ?? (!Array.isArray(record.data) ? record.data : null) ?? payload);
  if (direct && (!slug || direct.slug === slug)) return direct;

  const posts = getPostsFromPayload(payload);
  if (!slug) return posts[0] ?? null;
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getSedifexBlogPosts() {
  if (!SEDIFEX_STORE_ID) return fallbackBlogPosts;

  try {
    const response = await fetch(getBlogUrl(), { next: { revalidate: 120 } });
    if (!response.ok) return fallbackBlogPosts;
    const payload = await response.json();
    const posts = getPostsFromPayload(payload);
    return posts.length ? posts : fallbackBlogPosts;
  } catch {
    return fallbackBlogPosts;
  }
}

export async function getSedifexBlogPost(slug: string) {
  if (!SEDIFEX_STORE_ID) return fallbackBlogPosts.find((post) => post.slug === slug) ?? null;

  try {
    const response = await fetch(getBlogUrl(slug), { next: { revalidate: 120 } });
    if (response.ok) {
      const payload = await response.json();
      const post = getPostFromPayload(payload, slug);
      if (post) return post;
    }

    const posts = await getSedifexBlogPosts();
    return posts.find((post) => post.slug === slug) ?? null;
  } catch {
    const posts = await getSedifexBlogPosts();
    return posts.find((post) => post.slug === slug) ?? null;
  }
}

export function formatBlogDate(value?: string | null) {
  if (!value) return 'Latest guide';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest guide';
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function stripHtml(value?: string | null) {
  return value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
}

export function sanitizeBlogHtml(value?: string | null) {
  if (!value) return '<p>This post is being prepared. Please check back soon.</p>';

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href=("|')javascript:[\s\S]*?\1/gi, 'href="#"')
    .replace(/src=("|')javascript:[\s\S]*?\1/gi, 'src=""')
    .replace(/<a\s/gi, '<a rel="noopener noreferrer" target="_blank" ');
}
