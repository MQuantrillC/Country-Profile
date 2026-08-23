import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // `images.domains` is deprecated; remotePatterns is the supported form and is
    // narrower - it pins the protocol and path rather than trusting a whole host.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
