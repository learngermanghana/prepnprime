import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Keep optimized variants in Vercel's image cache for at least a day so
    // repeat visits do not keep regenerating the same product/gallery images.
    minimumCacheTTL: 60 * 60 * 24,
    // A smaller responsive width set means fewer distinct image transformations
    // while still covering phones, tablets, laptops and large desktop screens.
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [32, 64, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  }
};

export default nextConfig;
