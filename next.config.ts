import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilita Turbopack (padrão no Next.js 16+)
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
};

export default nextConfig;
