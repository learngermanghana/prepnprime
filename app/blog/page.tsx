import Image from 'next/image';
import Link from 'next/link';
import { SectionHeading } from '@/components/section-heading';
import { formatBlogDate, getSedifexBlogPosts } from '@/lib/blog';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata(
  'Blog',
  'Read Prep N Prime GH skincare and body care guides for Accra, Haatso, East Legon, Airport, Madina and nearby areas.',
  '/blog'
);

function normalizeImageUrl(url?: string | null) {
  if (!url?.trim()) return 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=80';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  return encodeURI(url);
}

export default async function BlogPage() {
  const posts = await getSedifexBlogPosts();

  return (
    <section className='mx-auto max-w-7xl space-y-10 px-4 py-14 md:px-6'>
      <SectionHeading
        eyebrow='Beauty guides'
        title='Skincare & body care blog'
        description='Helpful guides from Prep N Prime GH on skincare, body care, glow products, sunscreen, dark spots, and beauty shopping in Accra.'
      />

      <div className='grid gap-6 md:grid-cols-3'>
        {posts.map((post) => {
          const image = normalizeImageUrl(post.coverImageUrl);
          return (
            <article key={post.slug} className='overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm'>
              <Link href={`/blog/${post.slug}`} className='block'>
                <div className='relative h-56 bg-stone-100'>
                  <Image
                    src={image}
                    alt={post.coverImageAlt || post.title}
                    fill
                    className='object-cover'
                    sizes='(max-width: 768px) 100vw, 33vw'
                  />
                </div>
              </Link>
              <div className='space-y-3 p-5'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-rose-500'>{formatBlogDate(post.publishedAt)}</p>
                <h2 className='text-xl font-semibold text-stone-900'>
                  <Link href={`/blog/${post.slug}`} className='hover:underline'>
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt ? <p className='text-sm leading-6 text-stone-600'>{post.excerpt}</p> : null}
                <Link href={`/blog/${post.slug}`} className='inline-flex text-sm font-semibold text-rose-600'>
                  Read article →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
