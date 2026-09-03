import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // FINN serves every listing photo and agency logo from this CDN.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.finncdn.no' },
    ],
    minimumCacheTTL: 60 * 60 * 24,
  },
  // The harvested dataset is read with fs at runtime, so trace it into the
  // serverless bundle explicitly.
  outputFileTracingIncludes: {
    '/**': ['./data/**'],
  },
};

export default nextConfig;
