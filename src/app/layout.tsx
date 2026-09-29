import type { Metadata, Viewport } from "next";
import { Archivo, DM_Sans, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BackToTop } from "@/components/ui/back-to-top";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { editorialBootScript } from "@/components/editorial/boot-script";
import { SiteClassSync } from "@/components/editorial/site-class-sync";
import { RouteTransitions } from "@/components/editorial/route-transitions";
import { ScrollFallback } from "@/components/editorial/scroll-fallback";
import "./globals.css";

// Headings: Archivo (variable weight, normal width).
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  preload: true,
});

// Body: DM Sans, variable optical size; set to a tighter, editorial cut
// (opsz 32) in globals.css.
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--font-dm-sans",
  preload: true,
});

// Small highlights: labels, eyebrows, badges, metadata.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFCFA" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.craefto.com"),
  title: {
    default: "Craefto | Creative Tech Studio",
    template: "%s | Craefto",
  },
  description:
    "Craefto is a creative tech studio. We design and build brands, products, and tools for founders and teams who value craft.",
  keywords: [
    "design studio",
    "web development",
    "brand identity",
    "SaaS development",
    "creative technology",
    "design systems",
    "Next.js development",
    "React development",
    "startup studio",
    "UI/UX design",
    "product design",
    "web design agency",
  ],
  authors: [{ name: "Craefto", url: "https://www.craefto.com" }],
  creator: "Craefto",
  publisher: "Craefto",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Favicon and Icons - properly configured for all browsers
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#1A1714" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Craefto",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "./",
    siteName: "Craefto",
    title: "Craefto | Creative Tech Studio",
    description:
      "We design and build brands, products, and tools for founders and teams who value craft.",
    // The image comes from app/opengraph-image.tsx (and each route's own card).
  },
  twitter: {
    card: "summary_large_image",
    title: "Craefto | Creative Tech Studio",
    description:
      "We design and build brands, products, and tools for founders and teams who value craft.",
    creator: "@craefto",
    site: "@craefto",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // "./" resolves to each page's own path, so no page can inherit the
  // homepage as its canonical. Pages with their own metadata set it explicitly.
  alternates: {
    canonical: "./",
  },
  verification: {
    google: "kXrPFgynaTLHeof1J6rY-uZKVo6dYXXQYbKU71lbfpg",
  },
  category: "technology",
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.craefto.com/#organization",
  name: "Craefto",
  description:
    "Craefto is a creative tech studio. We design and build brands, products, and tools for founders and teams who value craft.",
  url: "https://www.craefto.com",
  logo: "https://www.craefto.com/logo.png",
  sameAs: [
    "https://x.com/craefto",
    "https://www.linkedin.com/company/craefto",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@craefto.com",
    contactType: "customer service",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sydney",
    addressRegion: "NSW",
    addressCountry: "AU",
  },
  foundingDate: "2025",
  numberOfEmployees: {
    "@type": "QuantitativeValue",
    minValue: 1,
    maxValue: 10,
  },
  knowsAbout: [
    "Web Development",
    "Brand Identity",
    "UI/UX Design",
    "SaaS Development",
    "Design Systems",
    "Creative Technology",
  ],
  makesOffer: [
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Brand Identity & Design Systems",
        description: "Strategic foundations and visual systems that scale with your business.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Web Design & Development",
        description: "Marketing sites, SaaS platforms, and dashboards built for performance.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Digital Products & Platforms",
        description: "MVPs, interactive experiences, and scalable tools from concept to launch.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "AI & Automation",
        description: "Intelligent systems, agents, and automation for modern teams.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Security & Penetration Testing",
        description: "Vulnerability assessments and security audits to protect your systems.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${archivo.variable} ${dmSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: editorialBootScript }} />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {/* Skip Link for Accessibility */}
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[hsl(var(--color-primary))] focus:text-[hsl(var(--color-primary-foreground))] focus:top-0 focus:left-0"
        >
          Skip to main content
        </a>
        {children}
        <BackToTop />

        <SiteClassSync />
        <RouteTransitions />
        <ScrollFallback />
        <AnalyticsProvider />
        <Analytics />
        {/* Core Web Vitals from real visits (Vercel dashboard > Speed Insights) */}
        <SpeedInsights />
      </body>
    </html>
  );
}
