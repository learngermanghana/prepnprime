import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatBlogDate, getSedifexBlogPost, getSedifexBlogPosts, sanitizeBlogHtml, stripHtml } from '@/lib/blog';

const siteUrl = 'https://www.prepnprimegh.com';
const fallbackImage = 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=80';

function normalizeImageUrl(url?: string | null) {
  if (!url?.trim()) return fallbackImage;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  return encodeURI(url);
}

export async function generateStaticParams() {
  const posts = await getSedifexBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getSedifexBlogPost(slug);

  if (!post) return { title: 'Blog post not found | Prep N Prime GH' };

  const description = post.excerpt || stripHtml(post.contentHtml).slice(0, 155) || 'Read this Prep N Prime GH skincare and body care guide.';
  const url = `${siteUrl}/blog/${post.slug}`;
  const image = normalizeImageUrl(post.coverImageUrl);

  return {
    title: `${post.title} | Prep N Prime GH`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} | Prep N Prime GH`,
      description,
      url,
      type: 'article',
      images: [{ url: image }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Prep N Prime GH`,
      description,
      images: [image]
    }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getSedifexBlogPost(slug);

  if (!post) notFound();

  const image = normalizeImageUrl(post.coverImageUrl);
  const cleanHtml = sanitizeBlogHtml(post.contentHtml);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || stripHtml(post.contentHtml).slice(0, 155),
    image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.authorName || 'Prep N Prime GH'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Prep N Prime GH'
    },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`
  };

  return (
    <article className='mx-auto max-w-4xl px-4 py-14 md:px-6'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }}
      />

      <Link href='/blog' className='text-sm font-medium text-rose-600'>← Back to blog</Link>

      <header className='mt-6 space-y-4'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-rose-500'>{formatBlogDate(post.publishedAt)}</p>
        <h1 className='text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl'>{post.title}</h1>
        {post.excerpt ? <p className='text-lg leading-8 text-stone-600'>{post.excerpt}</p> : null}
      </header>

      <div className='relative mt-8 h-[420px] overflow-hidden rounded-3xl bg-stone-100'>
        <Image src={image} alt={post.coverImageAlt || post.title} fill className='object-cover' sizes='(max-width: 768px) 100vw, 900px' />
      </div>

      <div
        className='prose prose-stone mt-10 max-w-none prose-headings:text-stone-900 prose-a:text-rose-600 prose-img:rounded-2xl'
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />

      <div className='mt-10 rounded-3xl bg-[#fff5f7] p-6'>
        <h2 className='text-xl font-semibold text-stone-900'>Need help choosing products?</h2>
        <p className='mt-2 text-sm leading-6 text-stone-600'>Visit Prep N Prime GH in Haatso, Accra or shop online. Our team can help you choose skincare and body care products for your routine.</p>
        <Link href='/shop' className='mt-4 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white'>Shop products</Link>
      </div>
    </article>
  );
}
