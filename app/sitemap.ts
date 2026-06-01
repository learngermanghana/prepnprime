import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.prepnprimegh.com';

const routes = [
  { path: '', changeFrequency: 'daily' as const, priority: 1 },
  { path: '/shop', changeFrequency: 'daily' as const, priority: 0.95 },
  { path: '/brand', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/consultation', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
