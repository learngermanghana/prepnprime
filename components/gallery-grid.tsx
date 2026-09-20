import Image from 'next/image';
import { SedifexGalleryItem } from '@/lib/types';

export function GalleryGrid({ items }: { items: SedifexGalleryItem[] }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
      {items.map((item, index) => (
        <figure key={`${item.url}-${index}`} className='overflow-hidden rounded-2xl border border-stone-200 bg-white'>
          <div className='relative h-52'>
            <Image
              src={item.url || '/images/placeholder-beauty.svg'}
              alt={item.alt || 'Beauty shop gallery image'}
              fill
              className='object-cover'
              sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw'
            />
          </div>
          {item.caption ? <figcaption className='p-3 text-sm text-stone-600'>{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
