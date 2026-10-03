// Case studies: the single source for /work, /work/[slug], their metadata and the sitemap.

import type { CapabilityId } from "./capabilities";

export interface Metric {
  label: string;
  value: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

/** One setup on a photo shoot: its frames side by side, near-identical takes together. */
export interface PhotoSet {
  /** Where it was shot: "Rooftop car park". */
  title: string;
  /** What the frames show. */
  caption: string;
  /** Portrait (2:3) frames. */
  images: GalleryImage[];
  /** Where it sits in the story: "hero" opens the page in place of the hero
      image; the others follow that section's text. */
  placement: "hero" | "challenge" | "approach" | "solution" | "outcome";
}

export interface CaseStudy {
  slug: string;
  title: string;
  description: string;
  /**
   * The capabilities (content/capabilities.ts) this work shows, most prominent
   * first. Only what the case study itself shows: its services and its pages.
   */
  capabilities: CapabilityId[];
  /** A one-off project, or ongoing work under a monthly plan. Defaults to project. */
  engagement?: "project" | "ongoing";
  client: string;
  industry: string;
  timeline: string;
  year: number;
  featured: boolean;
  services: string[];
  techStack: string[];
  liveUrl?: string;
  /** The link's label when it isn't a website ("Visit live site"). */
  liveLabel?: string;
  githubUrl?: string;
  challenge: string;
  approach: string;
  solution: string;
  outcome: string;
  heroImage: string;
  /** Describes the hero image; without it the alt is "<title> hero". */
  heroAlt?: string;
  thumbnail: string;
  gallery: GalleryImage[];
  /** Device mockups made at 4:3. The hero and wide frames take that shape,
      so nothing is cropped, and the closing showcase shows the fourth
      gallery image rather than a 21:9 crop of the hero. */
  imageAspect?: "4/3";
  metrics?: Metric[];
  testimonial?: Testimonial;
  awards?: string[];
  accentColor?: string;
  /** Photo shoots: the photographs by setup, laid out in place of the
      screen-shaped gallery. */
  photoSets?: PhotoSet[];
}

// Projects that have real image files under /public/images/projects/{slug}/.
// Anything else, or any listed file that fails to load, renders a placeholder.
export const PROJECTS_WITH_REAL_IMAGES = ["tactix", "nuu", "fontkin", "globfam", "fx-foundations", "japanoma", "tav-partners", "artisan", "mng-steel", "nowuknow"];

export const caseStudies: CaseStudy[] = [
  {
    slug: "mng-steel",
    title: "MNG Steel",
    description: "Trilingual website, brand mark and a private DBM financing dossier for a Mongolian grinding-ball plant.",
    capabilities: ["product", "brand", "growth"],
    client: "MNG Steel LLC",
    industry: "Industrial Manufacturing / Mining Supply",
    timeline: "Sep 2026",
    year: 2026,
    featured: false,
    services: ["Logo Design", "Visual Identity", "UI/UX Design", "Frontend Development", "Backend Development", "Authentication", "SEO", "Deployment and DevOps", "Content", "Copywriting"],
    techStack: ["HTML / CSS / JavaScript", "Python static generator", "Pillow", "Vercel", "Vercel Functions (Node 24)", "Upstash Redis", "marked 12", "Google Fonts", "Artlist"],
    liveUrl: "https://mngsteel.mn/en/",
    challenge: "MNG Steel, a Mongolian steel grinding-ball plant operating since 2017, is preparing a plant-expansion loan with the Development Bank of Mongolia to meet the grinding-media specifications of Oyu Tolgoi and Erdenet. The company had a secured domain but no public presence, no brand mark and no consolidated view of how the bank lends: product terms, hard gates such as the minimum request and the financing cap, and the 65-document application checklist behind them. The work had to serve Mongolian financiers, domestic mine buyers and Chinese-speaking suppliers at once, in under two weeks, before the founder had confirmed most figures.",
    approach: "We started with evidence rather than layout. A research pass reverse-engineered the bank's website API, downloaded 52 public documents, read the audited statements for 2018 to 2025 and the 2025 draft law, and recorded every field with a source, date and confidence code. That library became the spine of a private dossier. For the site we chose a Python static generator that builds 24 pages in three languages from shared content dictionaries, so terminology can be corrected in one place. Every unconfirmed figure went into an assumptions register, the site stayed unindexed, and all photography was generated to a written brief until real plant photography exists.",
    solution: "Three connected pieces. A brand mark, a forged ball held between two chamfered forging dies, generated parametrically as SVG, PNG and favicon in on-light, on-dark and mono variants, ember orange on graphite. A trilingual static site at mngsteel.mn with home, products, quality, supply record, expansion, about, careers and contact pages, grouped navigation, product spec tabs, a seven-step process stepper, count-up figures, an embedded plant map, a quote form that prefills mill and ball size, and hreflang and canonical tags. And the DBM Financing Dossier, a bilingual single-file web app with 14 sections, Markdown rendering, a passphrase-gated serverless API and Upstash Redis holding an application profile that mirrors the bank's own form, with versioned snapshots.",
    outcome: "MNG Steel now has an identity and a site that presents it as an established supplier in Mongolian, English and Chinese, live on its own domain and ready to index once the founder clears the assumptions register. The dossier gives the founder and advisers one place to check the bank's requirements, track the 65 application documents and draft the loan application against the bank's own form structure. Whether the site has produced enquiries, and how the application progressed, is not recorded in the project files.",
    heroImage: "/images/projects/mng-steel/mng-steel-hero.jpg",
    thumbnail: "/images/projects/mng-steel/mng-steel-thumb.jpg",
    gallery: [
      { src: "/images/projects/mng-steel/mng-steel-gallery-01.jpg", alt: "The DBM Financing Dossier on a desktop monitor in a finance office beside a binder of application forms", caption: "The private dossier: 14 research sections and a bilingual application form saved to Redis." },
      { src: "/images/projects/mng-steel/mng-steel-gallery-02.jpg", alt: "The English MNG Steel site on a phone held on the plant floor beside quenched grinding balls", caption: "Three languages from one content source, so a corrected term changes everywhere at once." },
      { src: "/images/projects/mng-steel/mng-steel-gallery-03.jpg", alt: "The products page on a tablet on a metallurgy lab bench with a sectioned ball and a hardness tester", caption: "Product specifications as tabbed tables, with a quote link that prefills the contact form." },
    ],
    metrics: [
      { label: "Languages", value: "3" },
      { label: "Static Pages", value: "24" },
      { label: "Bank Documents Indexed", value: "52" },
      { label: "Dossier Sections", value: "14" },
    ],
    accentColor: "16 100% 56%",
  },
  {
    slug: "tav-partners",
    title: "TAV & Partners",
    description: "A typography-led static site and brand system for a new Sydney chartered accounting and tax advisory firm.",
    capabilities: ["product", "brand", "growth"],
    client: "TAV & Partners Pty Ltd",
    industry: "Professional Services / Accounting and Tax Advisory",
    timeline: "Jul 2026 – Sep 2026",
    year: 2026,
    featured: false,
    services: ["Visual Identity", "Motion Design", "UI/UX Design", "Design System", "Frontend Development", "Backend Development", "API Integration", "SEO", "Analytics", "Deployment and DevOps", "Content", "Copywriting"],
    techStack: ["Next.js 16", "React 19", "TypeScript 5", "Tailwind CSS 4", "Zod 4", "Resend 6", "Vercel Web Analytics 2", "Playwright 1 + axe-core", "Vercel"],
    liveUrl: "https://www.tavpartners.com.au",
    challenge: "TAV & Partners Pty Ltd is a newly established chartered accounting and tax advisory practice at 175 Pitt Street, Sydney. The firm was new but the practice behind it was not: many of its first clients had worked with the managing director for over a decade, and the site's first job was to confirm to those clients that this was a serious, technically capable practice rather than a startup. The brief asked for a reviewable version within five days. At kickoff there was no logo file, no photography, no bios, no confirmed registrations and no domain or DNS access, and Australian professional-services rules meant no credential, registration number or liability notice could be invented or shown without written confirmation.",
    approach: "We wrote a specification before any code and put every external dependency behind a swap-in seam, so the site could be complete and demonstrable with zero client input. Copy lives in typed content objects marked as draft until the client's wording replaced it, and regulatory fields render nothing until confirmed. The visual language is typography-led on a navy sampled from the client's own mark, with a verdigris accent chosen deliberately over the gold-on-navy default. After a first build read as plain and a second as oversized, we rebenchmarked the type and spacing scale against Carbon, Material 3, Atlassian and Geist, and varied the section shapes so pages read as designed rather than templated.",
    solution: "A fully static Next.js 16 site on Vercel with nine public routes, an unlisted brand reference page and ten typed content files. A ledger layout derived from the financial statement structures every page, using container queries so it holds in both full-bleed and nested contexts. The enquiry form is a Server Action with Zod validation, a honeypot, an in-memory rate limit and a transport interface that logs until a Resend key exists, then sends a branded notification and acknowledgement. Metadata, sitemap, robots, a generated social card and AccountingService JSON-LD are env-driven, so indexing is an explicit act at cutover. We also vectorised the supplied mark, produced a logo pack and email signature templates, and wrote the launch runbook.",
    outcome: "The first reviewable preview reached the client within days of kickoff, and the client's wording, team roster and regulatory details dropped in as they arrived without component changes. The site is live and indexed at www.tavpartners.com.au, with the enquiry form delivering to the firm and acknowledging enquirers. Recorded verification shows zero axe violations across every route and breakpoint, Lighthouse scores of 100 for performance, accessibility and best practices, and zero layout shift. The firm owns its own Vercel and Resend accounts, and the engagement has continued into team profiles, monthly traffic reporting and a team portrait session.",
    heroImage: "/images/projects/tav-partners/tav-partners-home-in-hands.jpg",
    heroAlt: "The TAV & Partners home page's 'Relationships measured in years, not engagements' section on a device held landscape in both hands",
    thumbnail: "/images/projects/tav-partners/tav-partners-thumb.jpg",
    imageAspect: "4/3",
    gallery: [
      { src: "/images/projects/tav-partners/tav-partners-about-ipad.jpg", alt: "The About page, 'An independent practice, built deliberately', on an iPad held in both hands", caption: "About. A new firm with decades of practice behind it, typography-led on a navy sampled from the client's own mark." },
      { src: "/images/projects/tav-partners/tav-partners-brand-system-ipad.jpg", alt: "The brand reference page's logo versions and colour palettes on an iPad resting on a dark upholstered chair with a walnut frame", caption: "The brand reference page, built from the same tokens as the site, ready for print and signage." },
      { src: "/images/projects/tav-partners/tav-partners-services-iphone.jpg", alt: "The Services page on an iPhone standing on a round walnut side table against a black background", caption: "Services on a phone. The ledger layout uses container queries, so it holds in full-bleed and nested contexts." },
      { src: "/images/projects/tav-partners/tav-partners-services-macbook.jpg", alt: "The Services page on a MacBook Air balanced on one hand against a grey background", caption: "Services. Four areas of practice set as a ledger, with a cadence label on each row." },
    ],
    metrics: [
      { label: "Lighthouse Scores", value: "100 / 100 / 100" },
      { label: "Axe Violations", value: "0" },
      { label: "Layout Shift", value: "0" },
      { label: "Services in 4 Clusters", value: "11" },
    ],
    accentColor: "224 48% 21%",
  },
  {
    slug: "japanoma",
    title: "JapanoMa",
    description: "A decision-aid platform helping Australian skiers weigh a Japan snow-country home base, from quiz to purchase.",
    capabilities: ["product", "systems", "media", "brand", "growth"],
    client: "Go&C Partners",
    industry: "Property / Cross-border Lifestyle Real Estate",
    timeline: "Feb 2026 – Ongoing",
    year: 2026,
    featured: false,
    services: ["Visual Identity", "Motion Design", "UI/UX Design", "Design System", "Frontend Development", "Backend Development", "API Integration", "Database Design", "Authentication", "Payments", "CMS", "SEO", "Analytics", "Deployment and DevOps", "Content", "Copywriting"],
    techStack: ["Next.js 15", "React 19", "TypeScript 5", "Tailwind CSS 4", "shadcn/ui", "Supabase", "Drizzle ORM", "Sanity 5", "Stripe", "Resend", "three.js / React Three Fiber 9", "Remotion 4", "Recharts 3", "React Hook Form 7 + Zod 4", "Zustand 5", "Google Gemini (vision)", "Cal.com", "Plausible", "Sentry", "Playwright + Jest 30", "Vercel"],
    liveUrl: "https://www.japanoma.com.au",
    challenge: "Go&C Partners wanted to help Australian skiers decide whether to buy a home base in Northern Japan without behaving like a listings portal or a broker. The audience is roughly 184,500 Australian skiers who distrust hype and need honest total-cost figures, due diligence and local execution before they talk to anyone selling. The engagement had a thirteen-week timeline, a two-person Craefto team, a client with no existing brand guidelines, and content still to be written. The platform also had to meet the Australian Privacy Act, Japan's APPI and GDPR from day one, hold up under launch traffic, and hand over cleanly to Go&C as a documented codebase.",
    approach: "We ran a three-week discovery that produced twelve architecture decision records, a scope-boundaries document separating v1 from v2, personas and sixty user stories before writing code. The visual language, Ma Space, treats emptiness as the primary material: a near-monochrome sumi and washi palette with one indigo accent, Shippori Mincho for headings, Satoshi for everything else, and a three-colour-per-screen rule. We chose Next.js with React Server Components and ISR so public pages are CDN-served, Supabase in Sydney for data residency, and Sanity so the client could edit without us. Every decision, and every later reversal, was written into the changelog with its reasoning, so the client inherits the why as well as the code.",
    solution: "We delivered a production platform with 49 pages and 19 API routes. Visitors take a seven-step lifestyle quiz that scores 29 launch areas across nine prefectures, explore them on a three.js map of Japan, and compare towns side by side. A weekly partner workbook feeds the property pipeline: parsing, haversine area assignment, deduplicated image mirroring, caption-based gallery selection and a Gemini-assisted floor-plan translation pilot. Registration gates listings, quiz and consultation booking; Stripe handles consultation credits and a dormant membership tier. A 33-second Remotion film opens the homepage, and a customer story turns one recorded interview into fifteen chapters with audio, word-timed captions and transcripts. An admin area covers leads, users, reviews, area media, compliance exports and insights.",
    outcome: "JapanoMa launched publicly on 26 May 2026 at japanoma.com.au, thirteen weeks after kickoff, and has been extended every month since. Production load testing drove the site to 2,000 concurrent users with zero failed requests. Go&C now runs its own editorial in Sanity, ingests partner stock weekly, and books and bills consultations through the platform. The quiz, once anonymous, now attaches every completion to a contactable account. Traffic, lead and revenue figures are not recorded in the repository.",
    heroImage: "/images/projects/japanoma/japanoma-devices.jpg",
    heroAlt: "JapanoMa on a desktop display, a MacBook Air and an iPad: the About page, the step-by-step pricing and the map of areas",
    thumbnail: "/images/projects/japanoma/japanoma-thumb.jpg",
    imageAspect: "4/3",
    gallery: [
      { src: "/images/projects/japanoma/japanoma-home-iphones.jpg", alt: "Three iPhones among dark blocks, two showing JapanoMa: the home page, 'Decide with Confidence', and the Myoko area page", caption: "Decide with confidence. The promise is made on the phone, where an Australian skier first meets it." },
      { src: "/images/projects/japanoma/japanoma-journey-macbook.jpg", alt: "The home page's 'Where are you in your journey?' section, with four starting points such as 'I'm exploring' and 'I'm preparing to buy', on a MacBook Air resting on dark blocks", caption: "Where are you in your journey? Four starting points, and no wrong place to begin." },
      { src: "/images/projects/japanoma/japanoma-envelopes.jpg", alt: "Two envelopes printed with the JapanoMa torii mark over a sumi-e mountain landscape", caption: "The Ma Space identity off screen: sumi and washi, with one indigo accent." },
      { src: "/images/projects/japanoma/japanoma-areas-ipad.jpg", alt: "The 'Find your area' map of Japan on an iPad standing on a dark block, with Sapporo featured", caption: "Find your area: 29 launch areas across nine prefectures, on a map of Japan." },
    ],
    metrics: [
      { label: "Kickoff to Launch", value: "13 weeks" },
      { label: "Load Tested, Zero Failures", value: "2,000 users" },
      { label: "Pages / API Routes", value: "49 / 19" },
      { label: "Database Tables", value: "37" },
    ],
    accentColor: "211 33% 36%",
  },
  {
    slug: "artisan",
    title: "Artisan",
    description: "Crew OS and spot marketplace for construction labour, built as a mobile app, site, deck and backend.",
    capabilities: ["product", "systems", "brand", "growth"],
    client: "Internal Product",
    industry: "Construction / Workforce Marketplace",
    timeline: "Jan 2026 – Jul 2026",
    year: 2026,
    featured: false,
    services: ["Brand Strategy", "Logo Design", "Visual Identity", "Motion Design", "UI/UX Design", "Design System", "Frontend Development", "Backend Development", "Mobile Development", "API Integration", "Database Design", "Authentication", "SEO", "Analytics", "Deployment and DevOps", "Content", "Copywriting"],
    techStack: ["Expo SDK 54", "React Native 0.81", "Expo Router 6", "React 19", "TypeScript 5", "Next.js 16", "Vite 7", "Tailwind CSS 4", "NativeWind 4", "Supabase", "PostgreSQL", "TanStack Query 5", "Mapbox", "Reanimated 4", "Motion 12", "Recharts 3", "Twilio Verify", "Expo Push", "Sentry", "Vercel", "EAS Build", "pgTAP", "GitHub Actions"],
    liveUrl: "https://artisan.construction",
    challenge: "Construction labour hiring in Sydney runs on phone calls, 9pm Facebook posts and word of mouth. A boss who needs steel fixers tomorrow has no record of who shows up, and a reliable worker's reputation never leaves their own circle. The founder, a former steel fixer, wanted a trust-aggregation platform for the trade, starting with the Mongolian steel-fixing community as the beachhead. The constraints were real: a solo builder, a non-technical audience on glare-lit sites with patchy signal, a two-sided cold-start problem, and a product that must look like a tool for the boss rather than an employer or labour-hire agency. Everything had to be built, branded and hardened without a team.",
    approach: "We started with strategy before screens: an aggregation thesis, a trust loop and a cold-start plan written in January 2026, then a Ship 1 scope that excluded payments, messaging and scheduling. The June realisation changed the architecture. Field truth showed 80 to 90 percent of worker-days move inside standing crews, so we reframed Artisan as two layers over one spine: a single-player Crew OS at the core and the spot marketplace as the overflow valve, joined by a worker-day primitive with one state per worker per day. We chose Supabase with row-level security as the only access layer, Expo for a single mobile codebase, and one token file so the app, site and deck could not drift apart.",
    solution: "An Expo mobile app with 37 screens across boss, worker and auth flows, split into Artisan Crew and Artisan Jobs modes behind one toggle: crew invites by phone, per-worker rates, a schedule grid, a 6am Today screen with one-tap attendance, a lending exchange between bosses, a clustered Mapbox job map and a reputation engine fed by confirmed attendance. A Supabase backend with 28 tables, 43 migrations, 40 SQL functions, four edge functions and pgTAP security tests in CI. Around it: the nipper logo and brand kit with exportable tokens, a bilingual English and Mongolian marketing site with SEO and a live Founding-100 counter, a bilingual research survey, an operations dashboard, and a 24-section investor deck with a 17-slide pitch.",
    outcome: "By July 2026 the full hire loop, Crew OS spine, lending exchange and push notifications were running end to end against the production backend, with a July production-readiness audit reproduced live and its P0 and P1 findings closed the same week. The marketing site is live at artisan.construction and every call to action funnels into the Founding-100 survey. The mobile app was moving through EAS builds toward TestFlight and the stores at the last commit. Usage numbers, store release and the first crews onboarded are not recorded in the repository.",
    heroImage: "/images/projects/artisan/artisan-hero.jpg",
    thumbnail: "/images/projects/artisan/artisan-thumb.jpg",
    gallery: [
      { src: "/images/projects/artisan/artisan-gallery-01.jpg", alt: "The artisan.construction marketing site on a laptop in a site office", caption: "The marketing site in English and Mongolian, with a live Founding-100 counter." },
      { src: "/images/projects/artisan/artisan-gallery-02.jpg", alt: "The boss Today screen on a phone held on a rebar deck", caption: "The 6am screen. Attendance confirmed in one tap feeds the reliability engine." },
      { src: "/images/projects/artisan/artisan-gallery-03.jpg", alt: "The Jobs map on a phone at the end of a site day", caption: "The spillover marketplace, drawing only on free, crew-verified days." },
    ],
    metrics: [
      { label: "Mobile Screens", value: "37" },
      { label: "Tables / Migrations", value: "28 / 43" },
      { label: "Commits in Six Months", value: "193" },
      { label: "Languages", value: "EN + MN" },
    ],
    accentColor: "25 95% 53%",
  },
  {
    slug: "fx-foundations",
    title: "FX Foundations",
    description: "A bilingual forex education platform with 163 researched lessons, a trading simulator and Pro plans.",
    capabilities: ["product", "brand", "growth"],
    client: "Internal Product",
    industry: "Fintech / Trading Education",
    timeline: "Feb 2026 – Mar 2026",
    year: 2026,
    featured: false,
    services: ["Visual Identity", "UI/UX Design", "Design System", "Motion Design", "Frontend Development", "Backend Development", "API Integration", "Database Design", "Authentication", "Payments", "SEO", "Analytics", "Deployment and DevOps", "Content", "Copywriting"],
    techStack: ["Next.js 16", "React 19", "TypeScript 5", "Tailwind CSS 4", "Motion 12", "Lightweight Charts 5", "MDX (next-mdx-remote 6)", "next-intl 4", "Supabase", "Stripe", "Resend", "PostHog", "Vercel Analytics", "Google Cloud Text-to-Speech", "Vercel"],
    liveUrl: "https://fxfoundations.com",
    challenge: "Online forex education is dominated by broker-sponsored courses, signal sellers and outdated content farms. FX Foundations set out to publish a complete, research-backed curriculum, from first principles to algorithmic trading, that a beginner could trust and actually finish. The product had to serve English and Mongolian readers from day one. It had to keep the fundamentals free while earning enough from Pro subscriptions to sustain itself. Trust requirements were strict: every factual claim needed cited sources and every page needed a clear risk disclaimer. Technically it needed rich charts and interactive diagrams without hurting load times, and the whole platform, simulator included, was built in under two months.",
    approach: "We treated the curriculum as versioned code. Lessons live as MDX files in the repository with typed frontmatter for sources, key terms, prerequisites and FAQs, so content and interactive components ship together. The design direction was editorial rather than the usual dark trading terminal: Newsreader serif headlines, Geist body text, a warm off-white base and a muted forest green accent, all defined as Tailwind CSS 4 theme tokens. Server Components render lessons statically for speed and indexing, and only charts, quizzes and the simulator hydrate on the client. Monetization followed a written design spec: a metered paywall, sections six onward gated to Pro, and full lesson HTML kept in the DOM for search crawlers.",
    solution: "We delivered a Next.js 16 platform with 163 lessons across 18 sections, fully localised into Mongolian with next-intl. Lessons embed 21 custom visualization components and TradingView Lightweight Charts driven by scenario data. A trading simulator with a seeded price engine covers 19 instruments, pending orders, margin, indicators, drawing tools, session history, a public leaderboard and XP levels. Supabase handles auth, progress, certificates, journals and strategies across 16 tables, Stripe handles monthly and lifetime Pro plans, and Resend sends 14 templated emails including a drip sequence run by a Vercel cron. Google Cloud Text-to-Speech narrates every lesson. PostHog tracks 11 funnel events, and structured data, Open Graph images and FAQ schema cover search.",
    outcome: "FX Foundations is live at fxfoundations.com with the full bilingual curriculum, simulator, six calculators and Pro subscriptions in production. The repository records a 116 ms largest contentful paint and zero layout shift after the Core Web Vitals pass, with 181 pages pre-rendered at build time. The platform now has the instrumentation to measure conversion from free lessons to Pro, the email automation to re-engage readers, and a simulator designed to turn one-off readers into daily users. Post-launch traffic and revenue figures are not recorded in the repository.",
    heroImage: "/images/projects/fx-foundations/fx-foundations-hero.jpg",
    thumbnail: "/images/projects/fx-foundations/fx-foundations-thumb.jpg",
    gallery: [
      { src: "/images/projects/fx-foundations/fx-foundations-gallery-01.jpg", alt: "A lesson page on an iPad propped on a study desk beside headphones and a notebook", caption: "Every lesson is MDX with typed key terms, callouts and cited sources, narrated for listening on the go." },
      { src: "/images/projects/fx-foundations/fx-foundations-gallery-02.jpg", alt: "The curriculum page on a phone laid flat beside earbuds, a notebook and an espresso", caption: "18 sections, 163 lessons, 39 hours, all statically rendered and readable on a phone." },
      { src: "/images/projects/fx-foundations/fx-foundations-gallery-03.jpg", alt: "A lesson with a live EUR/USD candlestick chart on a green iMac in a plant-filled home study", caption: "Lessons embed live charts driven by scenario data, so a pip is something you watch move rather than read about." },
      { src: "/images/projects/fx-foundations/fx-foundations-gallery-04.jpg", alt: "Curriculum overview in Mongolian", caption: "Full Mongolian localisation across the curriculum and interface" },
      { src: "/images/projects/fx-foundations/fx-foundations-gallery-05.jpg", alt: "Public simulator leaderboard ranked by profit", caption: "Leaderboard, XP levels and achievements built on Supabase" },
    ],
    metrics: [
      { label: "Lessons", value: "163 × 2" },
      { label: "Visualization Components", value: "21" },
      { label: "API Endpoints", value: "22" },
      { label: "Simulator Instruments", value: "19" },
    ],
    accentColor: "153 40% 30%",
  },
  {
    slug: "fontkin",
    title: "Fontkin",
    description: "Professional font pairing lab for designers & developers with curated combinations and one-click exports.",
    capabilities: ["product", "brand", "growth"],
    client: "Internal Project",
    industry: "Design Tools",
    timeline: "Completed",
    year: 2026,
    featured: true,
    services: ["Brand Strategy", "UI/UX Design", "Design System", "Frontend Development", "SEO Implementation"],
    techStack: ["Next.js 14", "React 18", "TypeScript", "Tailwind CSS", "Framer Motion", "Google Fonts", "Radix UI", "Vercel"],
    liveUrl: "https://fontkin.com",
    githubUrl: "https://github.com/ObiBat/fontkin",
    challenge: "Typography is one of the most impactful design decisions, yet designers and developers often waste hours guessing font pairings. Existing tools either generate random combinations without design intent, overwhelm users with thousands of options from Google Fonts, or lack practical developer exports. The challenge was to create a curated, opinionated tool that provides professional-quality typography decisions with real-world context and one-click implementation for modern development workflows.",
    approach: "Rather than building another random font generator, the approach focused on curation over quantity. Each of the 34 font pairings was hand-selected based on real design principles—contrast, x-height compatibility, mood alignment, and use-case appropriateness. The tool was designed around three key insights: designers need to see fonts in context (web UI, editorial, hero sections), developers need copy-paste-ready code, and both audiences benefit from smart filtering by mood and purpose.",
    solution: "Fontkin delivers a comprehensive font pairing experience with multiple preview modes (web UI, editorial layouts, hero sections), a custom combo builder with fine-grained typography controls (weight, size, line-height, letter-spacing), a side-by-side comparison tool for up to 3 pairings, and developer-friendly exports in 4 formats: CSS variables, Tailwind config, Google Fonts HTML, and AI prompts for design handoff.",
    outcome: "Fontkin provides an intuitive solution for typography decisions that saves designers hours of font exploration. The curated approach ensures every pairing is production-ready, while multiple preview modes let users confidently visualize fonts in context before committing. The one-click export system bridges the design-to-development gap, eliminating copy errors and format inconsistencies.",
    heroImage: "/images/projects/fontkin/fontkin-hero.jpg",
    thumbnail: "/images/projects/fontkin/fontkin-thumb.jpg",
    gallery: [
      { src: "/images/projects/fontkin/fontkin-gallery-01.jpg", alt: "Font pairing explorer", caption: "Explore 34 curated font pairings" },
      { src: "/images/projects/fontkin/fontkin-gallery-02.jpg", alt: "Custom combo builder", caption: "Build custom type systems" },
      { src: "/images/projects/fontkin/fontkin-gallery-03.jpg", alt: "Typography preview", caption: "See fonts in real context" },
    ],
    metrics: [
      { label: "Font Pairings", value: "34" },
      { label: "Fonts in Library", value: "57" },
      { label: "Export Formats", value: "4" },
      { label: "Preview Modes", value: "3" },
    ],
    accentColor: "0 0% 6%",
  },
  {
    slug: "globfam",
    title: "GlobFam",
    description: "Cross-border family finance platform with premium branding & motion design system.",
    capabilities: ["brand", "media", "product"],
    client: "GlobFam Financial Technologies Inc.",
    industry: "Fintech / Family Finance",
    timeline: "Completed",
    year: 2025,
    featured: true,
    services: ["Brand Strategy", "Logo Design", "Motion Design", "UI/UX Design", "Design System", "Frontend Development", "Backend Development"],
    techStack: ["Next.js 15", "TypeScript", "React 18", "Tailwind CSS v4", "Framer Motion", "Lenis", "Supabase", "Resend", "Radix UI"],
    liveUrl: "https://globfam.io",
    challenge: "GlobFam needed a complete brand identity from scratch for their cross-border family finance platform. The challenge was creating a visual language that conveyed trust and security (essential for fintech) while feeling warm, approachable, and family-oriented. The brand needed to resonate with diverse global families managing finances across borders, balancing professionalism with emotional connection. Additionally, the digital presence required premium motion design to differentiate from competitors.",
    approach: "The design process began with extensive research into the emotional journey of families managing cross-border finances, understanding the stress of international transfers, the joy of shared goals, and the need for transparency. The 6-petal flower logo was developed as a symbol of family unity (each petal representing a family member) and organic growth. The color palette draws from nature: ocean blues for trust, mint greens for growth, and soft creams for warmth. A comprehensive motion design language was created using spring physics and magnetic interactions.",
    solution: "Delivered a complete brand system including: A distinctive 6-petal thin-stroke flower logo with animated variants; a carefully curated 15-color palette with semantic meanings; a dual-font typography system (Sora + Manrope) with fluid scales; a motion design language with custom easing curves, spring physics, and 9+ reusable animation components; an interactive design system documentation page; and a production-ready landing page with glassmorphism UI, magnetic hover effects, and a functional email waitlist system.",
    outcome: "The brand identity successfully positions GlobFam as a premium, trustworthy fintech platform while maintaining warmth and approachability. The motion design system creates memorable interactions that differentiate the product. The magnetic CTA buttons and organic blur backgrounds have become signature brand elements. The design system documentation ensures consistency across future development.",
    heroImage: "/images/projects/globfam/globfam-hero.jpg",
    thumbnail: "/images/projects/globfam/globfam-thumb.jpg",
    gallery: [
      { src: "/images/projects/globfam/globfam-gallery-01.jpg", alt: "GlobFam logo proportion", caption: "6-petal flower logo with precise grid system" },
      { src: "/images/projects/globfam/globfam-gallery-02.jpg", alt: "Color palette", caption: "Primary palette: Blue, Charcoal, Ivory, Green" },
      { src: "/images/projects/globfam/globfam-gallery-03.mp4", alt: "Motion design system", caption: "Spring physics and magnetic interactions" },
    ],
    metrics: [
      { label: "Animations", value: "364+" },
      { label: "Brand Colors", value: "15" },
      { label: "Components", value: "80+" },
      { label: "Motion Components", value: "9" },
    ],
    testimonial: {
      quote: "The branding work exceeded our expectations. The 6-petal flower logo perfectly captures our mission of bringing families together financially. The attention to motion design details makes our product feel premium and trustworthy.",
      author: "Founder",
      role: "CEO",
      company: "GlobFam Financial Technologies Inc.",
    },
    accentColor: "195 78% 38%",
  },
  {
    slug: "tactix",
    title: "TACTIX",
    description: "The world's most beautiful 3D chess learning platform with AI-powered coaching.",
    capabilities: ["product", "brand"],
    client: "Internal Product",
    industry: "EdTech / Gaming",
    timeline: "In Development",
    year: 2025,
    featured: true,
    services: ["Brand Strategy", "Design System", "UI/UX Design", "Frontend Development", "Backend Development", "3D Development", "AI Integration"],
    techStack: ["React 19", "TypeScript", "Three.js", "React Three Fiber", "Tailwind CSS", "Zustand", "Stockfish WASM", "Supabase", "Clerk", "Google Gemini", "WebSockets"],
    liveUrl: "https://tactix.run",
    challenge: "The chess software market is dominated by outdated interfaces that feel clinical and uninspiring. Existing platforms prioritize function over form, missing the opportunity to make chess feel like the elegant, strategic art form it truly is. The challenge was to create a chess platform that could rival AAA game visuals while maintaining educational depth, essentially MasterClass meets Gran Turismo for chess.",
    approach: "We adopted a visual excellence first philosophy, building the 3D rendering system before the game logic to ensure the visual standard would never be compromised. We chose React Three Fiber for declarative 3D scene management, allowing rapid iteration on lighting, materials, and animations. For the chess engine, we implemented Stockfish WASM client-side, eliminating server costs and latency while enabling offline play.",
    solution: "TACTIX delivers a premium 3D chess experience with mahogany-framed boards, realistic Staunton pieces with lathe-turned geometries, and professional 3-point lighting with bloom and vignette post-processing effects. The Learning Academy features 25+ interactive lessons across beginner to advanced tracks. The Stockfish integration offers 5 difficulty levels with real-time position evaluation. The exam system uses Google Gemini to generate personalized coaching reports.",
    outcome: "TACTIX successfully demonstrates that chess software can achieve AAA visual quality while remaining performant across devices. The adaptive DPR and LOD systems maintain smooth framerates even on mobile. The local-first architecture with Supabase sync ensures progress is never lost while minimizing backend costs. The platform is positioned for global ranked matchmaking and premium cosmetics monetization.",
    heroImage: "/images/projects/tactix/tactix-hero.jpg",
    thumbnail: "/images/projects/tactix/tactix-thumb.jpg",
    gallery: [
      { src: "/images/projects/tactix/tactix-gallery-01.jpg", alt: "3D chess gameplay interface", caption: "Premium 3D rendering with realistic materials" },
      { src: "/images/projects/tactix/tactix-gallery-02.jpg", alt: "Social chess learning", caption: "Learning chess together" },
      { src: "/images/projects/tactix/tactix-gallery-03.jpg", alt: "iPad tablet experience", caption: "Beautiful cross-device experience" },
    ],
    metrics: [
      { label: "Lessons", value: "25+" },
      { label: "Puzzles", value: "100+" },
      { label: "AI Levels", value: "5" },
      { label: "Server Latency", value: "0ms" },
    ],
    testimonial: {
      quote: "TACTIX represents what chess software should have always been: a visually stunning, intellectually engaging experience that respects both the beauty of the game and the intelligence of the player.",
      author: "Tactix Team",
      role: "Product Vision",
      company: "TACTIX",
    },
    accentColor: "45 61% 52%",
  },
  {
    slug: "nuu",
    title: "NUU",
    description: "AI-powered property matching platform for the Australian rental market.",
    capabilities: ["product", "brand"],
    client: "NUU Systems",
    industry: "PropTech / Real Estate",
    timeline: "MVP Complete",
    year: 2025,
    featured: true,
    services: ["Brand Strategy", "UI/UX Design", "Design System", "Frontend Development", "Backend Development", "AI/ML Integration", "Database Architecture"],
    techStack: ["React 19", "Vite", "TypeScript", "Three.js", "React Three Fiber", "OpenAI GPT-4o", "Supabase", "PostgreSQL", "pgvector", "PostGIS", "Vercel", "Tailwind CSS"],
    liveUrl: "https://nuu.agency",
    challenge: "The Australian rental market is notoriously competitive and frustrating. Renters struggle with fragmented listings across multiple platforms, impersonal search filters that don't capture lifestyle preferences, and an overwhelming number of unsuitable results. Traditional property search interfaces require users to think in technical terms rather than expressing what they actually want: 'a beachy vibe near good coffee shops' or 'somewhere quiet for my family near trains to the CBD'.",
    approach: "We took an AI-first design approach, reimagining property search as a conversation rather than a form. We implemented GPT-4o as a 'property concierge' that extracts structured preferences from natural language. We developed a sophisticated 7-factor weighted scoring algorithm that evaluates location, budget, features, amenities, transport, property type, and bedrooms. We created an industrial 'operating system' aesthetic that positions NUU as a premium, tech-forward solution.",
    solution: "NUU is a full-stack property matching platform featuring a conversational AI interface powered by GPT-4o that guides users through preference discovery in 2-3 natural exchanges. The multi-factor matching algorithm scores properties across 7 dimensions with bonuses for exceptional matches. The frontend features an immersive 3D architectural visualization built with Three.js, scroll-triggered animations, and a dark industrial design language. The backend runs on Vercel serverless with Supabase PostgreSQL, including pgvector for semantic search and PostGIS for geospatial queries.",
    outcome: "The platform transforms the rental search experience from a tedious filtering exercise into an engaging conversation. The AI accurately extracts preferences from casual language and the matching algorithm surfaces relevant properties. The industrial 'operating system' branding differentiates NUU in a market full of generic real estate interfaces. The architecture is built for scale with vector search ready for real-time property data feeds.",
    heroImage: "/images/projects/nuu/nuu-hero.jpg",
    thumbnail: "/images/projects/nuu/nuu-thumb.jpg",
    gallery: [
      { src: "/images/projects/nuu/nuu-gallery-01.jpg", alt: "AI concierge chat", caption: "GPT-4o powered conversational search" },
      { src: "/images/projects/nuu/nuu-gallery-02.jpg", alt: "Property results", caption: "Scored matches with AI explanations" },
      { src: "/images/projects/nuu/nuu-gallery-03.jpg", alt: "3D visualization", caption: "Three.js architectural scene" },
    ],
    metrics: [
      { label: "Conversations", value: "2-3" },
      { label: "Scoring Factors", value: "7" },
      { label: "Match Precision", value: "99%" },
      { label: "Response Time", value: "<2s" },
    ],
    testimonial: {
      quote: "NUU bypassed the traditional rental friction. My application was processed and approved in 48 hours. Efficiency at its finest.",
      author: "Batbold B.",
      role: "Engineer",
      company: "Sydney",
    },
    accentColor: "18 100% 50%",
  },
  // A photo shoot, and the oldest project here: last on /work, not featured,
  // so never on the home page or in the next-project links.
  {
    slug: "nowuknow",
    title: "Nowuknow",
    description: "A merch shoot for Nowuknow, the Sydney collective behind hip-hop, R&B and underground club nights.",
    capabilities: ["media"],
    client: "Nowuknow Sydney",
    industry: "Events / Club Nights",
    timeline: "Feb 2025",
    year: 2025,
    featured: false,
    services: ["Photography", "Photo Editing"],
    techStack: ["Fujifilm X-T5", "XF 56mm f/1.2", "Adobe Lightroom"],
    liveUrl: "https://www.instagram.com/nowuknow.syd/",
    liveLabel: "Nowuknow on Instagram",
    challenge: "Nowuknow is an event collective in Sydney that hosts hip-hop, R&B and underground club nights. Its new merch, a black tee with a liquid-chrome wordmark on the front and a teal graphic across the back, needed photographs with the same attitude as the nights.",
    approach: "We took the tees onto the street rather than into a studio. Over one afternoon, with two models and a single 56mm lens, the shoot moved from a rooftop car park to a lift lobby, neon shopfronts, lantern-lit streets and laneways. Each setup was shot as a short run of takes, so both prints come through, along with the way the tee sits and moves.",
    solution: "Every frame was finished in Lightroom with one grade: deep greens, warm skin and soft contrast, so the teal of the prints carries from one location to the next. Near-identical takes were kept together as sets, so there's a choice of framing and expression, and one frame was set into an old CRT television among tapes and stickers.",
    outcome: "Sixteen finished photographs across eight setups, from close-ups of the front print to full-length frames of the pair on the street.",
    heroImage: "/images/projects/nowuknow/nowuknow-07.jpg",
    thumbnail: "/images/projects/nowuknow/nowuknow-thumb.jpg",
    gallery: [],
    accentColor: "172 45% 40%",
    photoSets: [
      {
        title: "Neon shopfront",
        caption: "Three takes of one setup, under a restaurant's neon.",
        placement: "hero",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-06.jpg", alt: "Two models outside a Chinese restaurant under green and red neon" },
          { src: "/images/projects/nowuknow/nowuknow-07.jpg", alt: "A closer take under the restaurant's neon" },
          { src: "/images/projects/nowuknow/nowuknow-08.jpg", alt: "The same scene through a green poster in the foreground" },
        ],
      },
      {
        title: "Rooftop car park",
        caption: "Two takes of the same crouch, then in close on the front print.",
        placement: "challenge",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-01.jpg", alt: "A model in the black Nowuknow tee crouching on a rooftop car park" },
          { src: "/images/projects/nowuknow/nowuknow-02.jpg", alt: "The same crouch on the rooftop, framed closer" },
          { src: "/images/projects/nowuknow/nowuknow-03.jpg", alt: "Close on the tee's liquid-chrome front print" },
        ],
      },
      {
        title: "Lift lobby, level 4",
        caption: "Two takes by the car park lift.",
        placement: "approach",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-04.jpg", alt: "Two models by a car park lift on level 4" },
          { src: "/images/projects/nowuknow/nowuknow-05.jpg", alt: "A second take by the level 4 lift" },
        ],
      },
      {
        title: "Lantern street",
        caption: "Walking away with the back prints showing, then a pause on the street.",
        placement: "approach",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-09.jpg", alt: "Two models walking away down a lantern-lit street, the back prints showing" },
          { src: "/images/projects/nowuknow/nowuknow-10.jpg", alt: "Two models pausing on the street" },
        ],
      },
      {
        title: "The teal van",
        caption: "Three takes of the back print, against a van outside a tobacconist.",
        placement: "solution",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-11.jpg", alt: "The back print, an arm around the shoulders, beside a teal van" },
          { src: "/images/projects/nowuknow/nowuknow-12.jpg", alt: "The back print against the teal van and a tobacconist's sign" },
          { src: "/images/projects/nowuknow/nowuknow-13.jpg", alt: "A third take of the back print by the van" },
        ],
      },
      {
        title: "Laneway and Commonwealth Street",
        caption: "A laneway, then a window where the front and back prints share one frame.",
        placement: "solution",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-14.jpg", alt: "Two models in a laneway, one standing and one crouching" },
          { src: "/images/projects/nowuknow/nowuknow-15.jpg", alt: "Two models at a window on Commonwealth Street, one showing the back print and one the front" },
        ],
      },
      {
        title: "On the television",
        caption: "One frame set into an old CRT television, among tapes and stickers.",
        placement: "outcome",
        images: [
          { src: "/images/projects/nowuknow/nowuknow-16.jpg", alt: "The pair on the screen of an old CRT television, among video tapes and stickers" },
        ],
      },
    ],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
