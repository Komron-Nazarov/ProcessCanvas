import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
  async rewrites() {
    const backend = process.env.GO_API_URL ?? "http://localhost:8080";
    return { beforeFiles: [{ source: "/api/:path*", destination: `${backend}/api/:path*` }], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
