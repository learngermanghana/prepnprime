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
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
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

// Blog content changes infrequently, so hourly revalidation avoids unnecessary
// origin traffic and ISR/cache churn without requiring a redeploy for updates.
const BLOG_CACHE_SECONDS = 60 * 60;

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

function textValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function plainTextOrMarkdownToHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;

  const lines = trimmed.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    html.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      html.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      html.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      flushList();
      html.push(`<h2>${formatInlineMarkdown(line.slice(2))}</h2>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      listItems.push(formatInlineMarkdown(line.replace(/^[-*]\s+/, ''));
      continue;
    }

    flushList();
    html.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  flushList();
  return html.join('');
}

function normalizePost(raw: unknown): SedifexBlogPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const title = textValue(record, ['title']);
  const slug = textValue(record, ['slug', 'postSlug']);

  if (!title || !slug) return null;

  const htmlContent = textValue(record, ['contentHtml', 'html', 'htmlContent', 'bodyHtml']);
  const textContent = textValue(record, ['content', 'postContent', 'body', 'bodyText', 'contentText', 'description']);
  const contentHtml = htmlContent || plainTextOrMarkdownToHtml(textContent);
  const metaDescription = textValue(record, ['metaDescription', 'meta_description']);
  const excerpt = textValue(record, ['excerpt', 'summary']) || metaDescription || stripHtml(contentHtml).slice(0, 160) || null;
  const image = textValue(record, ['coverImageUrl', 'imageUrl', 'featuredImageUrl', 'ogImage']);

  return {
    id: textValue(record, ['id']) || undefined,
    title,
    slug,
    excerpt,
    coverImageUrl: image || null,
    coverImageAlt: textValue(record, ['coverImageAlt', 'imageAlt', 'alt']) || title,
    contentHtml,
    publishedAt: textValue(record, ['publishedAt', 'createdAt']) || null,
    updatedAt: textValue(record, ['updatedAt']) || null,
    authorName: textValue(record, ['authorName', 'author']) || null,
    tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    metaTitle: textValue(record, ['metaTitle', 'meta_title']) || null,
    metaDescription: metaDescription || null,
    canonicalUrl: textValue(record, ['canonicalUrl', 'canonical_url']) || null,
    ogImage: textValue(record, ['ogImage', 'og_image']) || image || null
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
    const response = await fetch(getBlogUrl(), { next: { revalidate: BLOG_CACHE_SECONDS } });
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
    const response = await fetch(getBlogUrl(slug), { next: { revalidate: BLOG_CACHE_SECONDS } });
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
