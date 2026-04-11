import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking is handled by CI pipeline separately
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
