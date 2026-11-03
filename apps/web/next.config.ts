import path from "node:path";
import type { NextConfig } from "next";

// Khi build trên GitHub Actions (GITHUB_PAGES=true) thì xuất web tĩnh ra apps/web/out
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isPages && {
    output: "export" as const,
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
    images: { unoptimized: true },
    trailingSlash: true,
  }),
  experimental: {
    agentFeedback: true,
  },
  // Xuất tĩnh (GitHub Pages) không dùng Cache Components
  cacheComponents: !isPages,
  partialPrefetching: !isPages,
  turbopack: {
    // Cố định root là apps/web (thư mục gốc repo có package-lock.json thừa)
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
