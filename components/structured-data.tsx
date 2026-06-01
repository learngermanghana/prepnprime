import { BRAND_NAME, BUSINESS_ADDRESS, PHONE_E164 } from '@/lib/constants';

const siteUrl = 'https://www.prepnprimegh.com';
const logoUrl = `${siteUrl}/logo.png`;

const serviceAreas = [
  'Accra',
  'Haatso',
  'Westlands',
  'East Legon',
  'Airport Residential Area',
  'Madina',
  'Legon',
  'North Legon',
  'Achimota',
  'Spintex',
  'Tema'
];

const beautyCategories = [
  'Skincare products in Accra',
  'Body care products in Accra',
  'Beauty products in Haatso',
  'Sunscreen in Ghana',
  'Face cleanser in Ghana',
  'Body lotion in Ghana',
  'Serums in Ghana',
  'Dark spot skincare in Ghana',
  'Glow body oil in Ghana',
  'Moisturizer in Accra'
];

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['LocalBusiness', 'Store', 'HealthAndBeautyBusiness'],
      '@id': `${siteUrl}/#localbusiness`,
      name: BRAND_NAME,
      alternateName: ['Prep N Prime Ghana', 'Prep and Prime GH', 'PrepNPrime GH'],
      url: siteUrl,
      telephone: PHONE_E164,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '44 Ato Ahwoi Ave, Westland, Haatso',
        addressLocality: 'Accra',
        addressRegion: 'Greater Accra',
        addressCountry: 'GH'
      },
      areaServed: serviceAreas.map((area) => ({ '@type': 'Place', name: area })),
      knowsAbout: beautyCategories,
      description:
        'Prep N Prime GH is a beauty and skincare shop in Haatso, Accra offering authentic body care, skin care, sunscreen, face cleanser, body lotion, serums, glow products, and consultation-led shopping.',
      slogan: 'Authentic beauty, skincare, and body care products in Accra.',
      image: [`${siteUrl}/og-image.jpg`],
      logo: logoUrl,
      priceRange: 'GH₵₵',
      currenciesAccepted: 'GHS',
      paymentAccepted: ['Cash', 'Mobile Money', 'Card', 'Paystack'],
      makesOffer: beautyCategories.map((name) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name,
          category: 'Beauty and personal care'
        },
        areaServed: serviceAreas.map((area) => ({ '@type': 'Place', name: area }))
      })),
      sameAs: []
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: BRAND_NAME,
      publisher: { '@id': `${siteUrl}/#localbusiness` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/shop?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'WebPage',
      '@id': `${siteUrl}/#homepage`,
      url: siteUrl,
      name: 'Beauty and skincare shop in Accra, Haatso and East Legon',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#localbusiness` },
      primaryImageOfPage: `${siteUrl}/og-image.jpg`,
      description:
        'Shop skincare and body care products in Accra, Haatso, East Legon, Airport, Madina, Legon, North Legon and nearby areas.'
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${siteUrl}/#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteUrl}/shop` },
        { '@type': 'ListItem', position: 3, name: 'Brand', item: `${siteUrl}/brand` },
        { '@type': 'ListItem', position: 4, name: 'Contact', item: `${siteUrl}/contact` }
      ]
    }
  ]
};

export function StructuredData() {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
    />
  );
}
