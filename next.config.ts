import type { NextConfig } from "next";

// Content-Security-Policy, in report-only mode: nothing is blocked, and each
// violation is logged by /api/csp-report (visible in the Vercel runtime
// logs). Once the reports are quiet, rename the header to
// Content-Security-Policy to enforce it. Inline scripts are allowed because
// Next inlines its bootstrap data and the site runs an inline boot script.
// vercel.live and pusher cover the Vercel toolbar on preview deployments.
// app.cal.com and cal.com serve the booking calendar in the client portal.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://app.cal.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://vercel.live https://vercel.com https://app.cal.com https://cal.com",
  "font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://assets.vercel.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live wss://ws-us3.pusher.com https://app.cal.com",
  "media-src 'self' blob: https://*.supabase.co",
  "frame-src 'self' blob: https://vercel.live https://app.cal.com https://cal.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "report-uri /api/csp-report",
  "report-to csp",
].join("; ");

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
  // Let phones on the local network use the dev server (hostnames, not URLs).
  allowedDevOrigins: ["192.168.1.*"],
  // Required for @sparticuz/chromium to resolve its binary correctly on Vercel
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  async redirects() {
    return [
      // The client portal has been retired; its subdomain sends people to the
      // main site. Temporary (307) so the address can be reused later.
      {
        source: "/:path*",
        has: [{ type: "host", value: "project-portal.craefto.com" }],
        destination: "https://www.craefto.com/",
        permanent: false,
      },
      // The company profile was renamed with the studio (October 2026).
      {
        source: "/craefto-company-profile.pdf",
        destination: "/craefto-works-company-profile.pdf",
        permanent: true,
      },
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
          // Production only: dev tooling (hot reload, overlays) would flood the reports.
          ...(process.env.NODE_ENV === "production"
            ? [
                { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
                { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
              ]
            : []),
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
