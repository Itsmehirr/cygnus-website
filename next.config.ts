import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standard rendering model: every page below is prerendered at build time;
  // only the two form actions run on the server.
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Addresses that changed while the site was being shaped. Temporary (307)
  // until launch, so nothing is cached for good while names may still move.
  async redirects() {
    return [{ source: "/design", destination: "/the-house", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
