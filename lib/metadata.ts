import type { Metadata } from 'next';
import { BUSINESS_ADDRESS } from '@/lib/constants';

const baseUrl = 'https://www.prepnprimegh.com';

const buildCanonicalUrl = (path = '/') => new URL(path, baseUrl).toString();

const localSeoKeywords = [
  'beauty shop in Ghana',
  'beauty shop in Accra',
  'skincare shop in Accra',
  'body care shop in Accra',
  'beauty products Accra',
  'skincare products Accra',
  'body care products Accra',
  'beauty products Haatso',
  'skincare products Haatso',
  'beauty shop Haatso',
  'beauty shop Westlands Haatso',
  'beauty shop East Legon',
  'skincare products East Legon',
  'beauty shop Airport Accra',
  'skincare products Airport Accra',
  'beauty products Madina',
  'beauty products Legon',
  'beauty products North Legon',
  'authentic beauty products Ghana',
  'authentic skincare Ghana',
  'sunscreen Ghana',
  'sunscreen Accra',
  'face cleanser Ghana',
  'face cleanser Accra',
  'body lotion Ghana',
  'body lotion Accra',
  'serums and skincare Ghana',
  'dark spot skincare Ghana',
  'glow body oil Ghana',
  'Prep N Prime GH',
  'Prep N Prime Ghana',
  BUSINESS_ADDRESS
];

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Prep N Prime GH | Beauty & Skincare Shop in Accra, Haatso',
    template: '%s | Prep N Prime GH'
  },
  description:
    `Shop authentic skincare, body care, sunscreen, face cleanser, body lotion, serums and glow products in Accra. Visit Prep N Prime GH at ${BUSINESS_ADDRESS}, serving Haatso, Westlands, East Legon, Airport, Madina, Legon and nearby areas.`,
  keywords: localSeoKeywords,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Prep N Prime GH | Beauty & Skincare Shop in Accra',
    description:
      `Premium body care and skincare products in Haatso, Accra with friendly consultation support at ${BUSINESS_ADDRESS}. Serving East Legon, Airport, Madina, Legon and nearby areas.`,
    type: 'website',
    locale: 'en_GH',
    url: baseUrl,
    siteName: 'Prep N Prime GH'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prep N Prime GH | Skincare Products in Accra',
    description: `Body care and skincare made simple, premium, and authentic in Haatso, Accra at ${BUSINESS_ADDRESS}.`
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  }
};

export const buildPageMetadata = (title: string, description: string, path = '/'): Metadata => {
  const canonical = buildCanonicalUrl(path);
  const brandedTitle = `${title} | Prep N Prime GH`;

  return {
    title,
    description,
    keywords: localSeoKeywords,
    alternates: { canonical },
    openGraph: { title: brandedTitle, description, url: canonical },
    twitter: { title: brandedTitle, description }
  };
};
