import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake heavy libraries — hanya import yang dipakai yang dikompilasi
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
