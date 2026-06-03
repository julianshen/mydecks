import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['[fd7a:115c:a1e0::1637:9a40]', 'localhost'],
};

export default nextConfig;
