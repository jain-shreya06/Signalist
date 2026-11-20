import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep build-time workers within the available local memory budget.
  experimental: { cpus: 1 },
};

export default nextConfig;
