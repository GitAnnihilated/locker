import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are our primary mutation path across every module.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
