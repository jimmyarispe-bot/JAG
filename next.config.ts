import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { CONTENT_SECURITY_POLICY } from "./src/lib/platform/security/content-security-policy";

/**
 * Performance (C.1) + Security headers (B.1).
 * P010 — optional ANALYZE=true wraps config with @next/bundle-analyzer.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Next 16 blocks cross-origin dev assets; 127.0.0.1 vs localhost breaks
  // HMR/hydration so client forms never attach submit handlers.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // P010 — tree-shake common package entrypoints when imported from barrels.
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/ssr"],
    /*
     * A SERVER ACTION TAKES 1MB BY DEFAULT, AND A SIGNED FORM IS BIGGER.
     *
     * /background-check requires the hire to upload their signed Clearinghouse
     * privacy acknowledgement. A phone photograph of a signed sheet is
     * routinely 3-6MB and a colour scan can be more. At the default limit the
     * submission fails with a body-size error the hire cannot act on, after
     * they have typed their social security number.
     *
     * 12MB, which is above the bucket's own 10MB cap - so the file is refused
     * by storage with a message we control rather than by the framework with
     * one we do not.
     */
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    const headers = [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:path*.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];

    // Never pin /_next/static as immutable in development — it leaves the
    // browser on stale client chunks, so form actions hydrate incorrectly and
    // submits can be swallowed with zero network requests.
    if (process.env.NODE_ENV === "production") {
      headers.splice(1, 0, {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      });
    }

    return headers;
  },
};

export default withBundleAnalyzer(nextConfig);
