# Prep N Prime GH Website

Production-ready Next.js App Router website for **Prep N Prime GH**, a Ghana beauty and skincare shop.

## Stack
- Next.js (App Router) + TypeScript
- React + React DOM
- Tailwind CSS v4
- ESLint
- Vercel Analytics + Speed Insights

## Routes
- /
- /shop
- /body-care
- /skin-care
- /collections
- /consultation
- /sensitive-skin
- /glow-products
- /about
- /contact
- /faq
- /privacy-policy
- /terms

## Sedifex Integration
Server-side integration is implemented in `lib/sedifex.ts`.

Endpoints used:
- `GET /v1IntegrationProducts?storeId=<storeId>`
- `GET /v1IntegrationPromo?storeId=<storeId>` (optional)
- `GET /integrationGallery?storeId=<storeId>` (optional)

Required headers:
- `x-api-key: <SEDIFEX_INTEGRATION_API_KEY or SEDIFEX_INTEGRATION_KEY>`
- `X-Sedifex-Contract-Version: 2026-04-13` (or `SEDIFEX_CONTRACT_VERSION`)

Features:
- Contract-versioned integration requests (header, not URL path)
- One-hour product/promotion caching and 12-hour gallery/blog caching
- Product deduplication by `id|storeId|name|price`
- Fallback sample data when API is unavailable
- Gallery publishing and sort handling
- Direct remote-image delivery by default to conserve Vercel Hobby image transformations

## Environment Variables
Copy `.env.example` to `.env.local`:

```bash
SEDIFEX_API_BASE_URL=
SEDIFEX_STORE_ID=
SEDIFEX_INTEGRATION_API_KEY=
SEDIFEX_INTEGRATION_KEY=
SEDIFEX_CONTRACT_VERSION=2026-04-13
# Optional: opt back into Vercel Image Optimization at build time.
VERCEL_IMAGE_OPTIMIZATION=false
```

## Local Development
Node: **>=20.9.0**

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Build & Start
```bash
npm run lint
npm run build
npm run start
```

## Deploy to Vercel
1. Push this repository to GitHub.
2. Import into Vercel.
3. Add environment variables in Vercel project settings.
4. Deploy.

## Content and Contact Replacements
Update these locations for production details:
- Contact email and address in `app/contact/page.tsx`
- Footer contact details in `components/site-footer.tsx`
- Metadata base URL in `lib/metadata.ts`
