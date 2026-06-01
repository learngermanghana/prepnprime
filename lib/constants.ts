export const BRAND_NAME = 'Prep N Prime GH';
export const PHONE_DISPLAY = '024 468 0516';
export const PHONE_E164 = '+233244680516';
export const WHATSAPP_LINK =
  'https://wa.me/233244680516?text=Hello%20Prep%20N%20Prime%20GH%2C%20I%20want%20to%20order%20your%20beauty%20products.';
export const BUSINESS_ADDRESS = '44 Ato Ahwoi Ave, Westland, Haatso, Ghana';

export const buildWhatsAppLink = (message: string) =>
  `https://wa.me/233244680516?text=${encodeURIComponent(message)}`;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/brand', label: 'Brand' },
  { href: '/blog', label: 'Blog' },
  { href: '/consultation', label: 'Consultation' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
] as const;

export const ACTIVITY_NAMES = [
  'Sandra',
  'Ama',
  'Abena',
  'Mabel',
  'Grace',
  'Naa',
  'Elsie',
  'Priscilla',
  'Adwoa',
  'Esi'
] as const;

export const ACTIVITY_PRODUCTS = [
  'Vitamin C serum',
  'Turmeric body scrub',
  'Shea butter lotion',
  'Hydrating face cleanser',
  'Niacinamide toner',
  'Sunscreen SPF 50',
  'Glow body oil',
  'Dark spot corrector',
  'Body wash duo',
  'Moisture repair cream'
] as const;

export const ACTIVITY_LOCATIONS = [
  'Accra',
  'Kumasi',
  'Tema',
  'East Legon',
  'Spintex',
  'Takoradi',
  'Cape Coast',
  'Madina'
] as const;

export const ACTIVITY_TIME_TEXT = [
  '2 mins ago',
  '5 mins ago',
  '8 mins ago',
  '12 mins ago',
  '18 mins ago',
  '25 mins ago',
  '31 mins ago',
  '44 mins ago'
] as const;
