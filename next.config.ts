import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the client router cache as short as Next allows (dynamic pages are
  // never reused; static ones for 30s, the minimum) so back navigation
  // always renders fresh pages.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  // Allow mobile devices on local network to access dev server
  allowedDevOrigins: ["http://192.168.1.100:3000"],
  // Required for @sparticuz/chromium to resolve its binary correctly on Vercel
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  async redirects() {
    return [
      {
        source: "/journal/author/craefto-lab",
        destination: "/journal/author/craefto-works",
        permanent: true,
      },
      // /lab was a second About page from the Craefto Lab days; its story now lives on /about.
      {
        source: "/lab",
        destination: "/about",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
  images: {
    // AVIF first (smallest), WebP for browsers without it.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
