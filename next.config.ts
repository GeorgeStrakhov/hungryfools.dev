import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Allow MDX files to be routed/imported
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/flags",
        destination: "https://eu.i.posthog.com/flags",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

// Enable MDX with remark/rehype plugins (string names for Turbopack)
const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // @ts-expect-error - String plugin names required for Turbopack compatibility
    remarkPlugins: [["remark-gfm", { strict: true, throwOnError: true }]],
    rehypePlugins: [
      // @ts-expect-error - String plugin names required for Turbopack compatibility
      ["rehype-slug", { strict: true, throwOnError: true }],
      // @ts-expect-error - String plugin names required for Turbopack compatibility
      ["rehype-autolink-headings", { strict: true, throwOnError: true }],
    ],
  },
});

export default withMDX(nextConfig);
