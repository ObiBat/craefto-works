"use client";

import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { PageTransition, AnimatedSection, HeroText } from "@/components/ui";
import { RevealText } from "@/components/editorial/reveal-text";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type ChangeCategory = "design" | "engineering" | "content" | "security" | "platform" | "branding";

interface ChangeEntry {
  title: string;
  description: string;
  categories: ChangeCategory[];
  commits?: number;
}

interface ChangelogEntry {
  date: string;
  version?: string;
  milestone?: string;
  changes: ChangeEntry[];
}

// ─────────────────────────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────

const categoryConfig: Record<ChangeCategory, { label: string; color: string }> = {
  design: {
    label: "Design",
    color: "bg-[hsl(145,18%,36%)] text-white",
  },
  engineering: {
    label: "Engineering",
    color: "bg-[hsl(30,12%,9%)] text-[hsl(38,33%,97%)]",
  },
  content: {
    label: "Content",
    color: "bg-[hsl(35,55%,50%)] text-white",
  },
  security: {
    label: "Security",
    color: "bg-[hsl(5,45%,48%)] text-white",
  },
  platform: {
    label: "Platform",
    color: "bg-[hsl(220,14%,46%)] text-white",
  },
  branding: {
    label: "Branding",
    color: "bg-[hsl(280,12%,42%)] text-white",
  },
};

// ─────────────────────────────────────────────────────────────
// CHANGELOG DATA
// ─────────────────────────────────────────────────────────────

const changelog: ChangelogEntry[] = [
  {
    date: "April 8, 2026",
    version: "2.4.1",
    milestone: "Careers Hardening",
    changes: [
      {
        title: "Careers form security pass",
        description: "Hardened the job application flow before public traffic. Every applicant-supplied value in the admin notification email is now HTML-escaped (closing an XSS vector via filename / URL / free-text answers). File uploads now flow through server-issued signed URLs — the browser never holds a key that can write to storage, and a new migration revokes the public-insert policy on the storage bucket. The applications endpoint validates that resume and cover letter URLs originate from our own bucket, and the in-process rate limiter has been replaced with a persistent count over recent submissions so the 5/hour ceiling survives serverless cold starts. Supabase clients now fail loudly on missing env vars instead of throwing opaque errors at first use.",
        categories: ["security", "engineering"],
        commits: 5,
      },
      {
        title: "Apply form accessibility pass",
        description: "Every input on the application form is now programmatically associated with its label via htmlFor / id, so screen readers announce labels on focus and clicking the label focuses the input. Chip-style single-select and multi-select questions are exposed as semantic radio and checkbox groups. The active progress step is marked aria-current, and a persistent live region announces step transitions and field errors to assistive tech.",
        categories: ["engineering", "design"],
        commits: 2,
      },
      {
        title: "Apply flow UX fixes",
        description: "Removed the fake \"Submit\" pseudo-step that was breaking the progress counter — submission is now an overlay rather than a fifth step. handleSubmit re-validates every prior step so editing fields from the Review screen can no longer slip past validation. Draft restore now caps the resumed step at Files, since file uploads cannot survive a refresh. Cleaned up dead formatDate helpers on the careers index and role detail pages.",
        categories: ["engineering", "design"],
        commits: 3,
      },
    ],
  },
  {
    date: "March 29, 2026",
    version: "2.4.0",
    milestone: "Services Experience Overhaul",
    changes: [
      {
        title: "Redesigned service cards",
        description: "Removed hover expand/collapse pattern that caused layout jumps. All service content (scenarios, includes) is now always visible. Each card animates individually on scroll.",
        categories: ["design", "engineering"],
        commits: 3,
      },
      {
        title: "Smooth cross-page navigation",
        description: "Tapping service links from the First Time Here page now scrolls to the correct section on Services with a smooth transition instead of jumping to the bottom.",
        categories: ["engineering"],
        commits: 2,
      },
      {
        title: "Typography consistency pass",
        description: "Normalized hero subtitle sizing across all pages. Standardized to text-lg for consistent visual rhythm.",
        categories: ["design"],
        commits: 1,
      },
      {
        title: "Global spacing tightened",
        description: "Reduced section spacing across all tiers for a more editorial, tighter feel. Normalized padding between every page for full consistency.",
        categories: ["design"],
        commits: 2,
      },
    ],
  },
  {
    date: "March 28, 2026",
    version: "2.3.0",
    milestone: "Content Overhaul",
    changes: [
      {
        title: "Qlip-inspired site rewrite",
        description: "Complete content overhaul inspired by award-winning agency qlip.co.jp. New pages: First Time Here (/start) and How We Work (/process). Rewritten services page with problem-first framing, FAQ, and transparent pricing. Updated About page with real founder story.",
        categories: ["design", "content"],
        commits: 7,
      },
    ],
  },
  {
    date: "March 8, 2026",
    version: "2.2.0",
    milestone: "Portal & Rebrand",
    changes: [
      {
        title: "Client portal rebuilt",
        description: "Three-sprint rebuild of the stakeholder portal. New dashboard, project detail views, and authentication flow. Integrated with Linear for real project data and Supabase for cookie-based auth.",
        categories: ["engineering", "platform"],
        commits: 4,
      },
      {
        title: "Business renamed",
        description: "Renamed the business across all pages. Cleaner, sharper, no \"Lab\" suffix.",
        categories: ["branding"],
        commits: 1,
      },
    ],
  },
  {
    date: "March 7, 2026",
    version: "2.1.1",
    changes: [
      {
        title: "New journal article",
        description: "Published \"Why Nvidia Stepped Back from OpenAI and Anthropic\" with custom stats cards, stock tickers, and pull quotes.",
        categories: ["content"],
        commits: 1,
      },
    ],
  },
  {
    date: "March 1–2, 2026",
    version: "2.1.0",
    milestone: "Portal Launch",
    changes: [
      {
        title: "Stakeholder portal goes live",
        description: "Six sprints shipped in rapid succession: auth hardening with RLS and RBAC, rich text editor, file uploads, data visualization, client experience features (requests, documents, payments, approvals), and growth tools (case study integration, PWA, LinkedIn). Deployed to project-portal.craefto.com.",
        categories: ["engineering", "platform", "security"],
        commits: 18,
      },
    ],
  },
  {
    date: "February 26, 2026",
    version: "2.0.2",
    changes: [
      {
        title: "UI polish",
        description: "Updated service button hover animations, removed cookie consent popup for cleaner first impression.",
        categories: ["design"],
        commits: 3,
      },
    ],
  },
  {
    date: "February 16, 2026",
    version: "2.0.1",
    changes: [
      {
        title: "Security patch",
        description: "Updated next-mdx-remote to v6 to address a security vulnerability in the MDX rendering pipeline.",
        categories: ["security"],
        commits: 1,
      },
      {
        title: "Team update",
        description: "Added Sara's LinkedIn profile to the team section.",
        categories: ["content"],
        commits: 1,
      },
    ],
  },
  {
    date: "February 9–11, 2026",
    version: "2.0.0",
    milestone: "Brand Refresh",
    changes: [
      {
        title: "Logo v2",
        description: "Updated the Craefto logo to a refined second version. New favicon across all platforms with cache-busting deployment.",
        categories: ["branding", "design"],
        commits: 3,
      },
      {
        title: "Journal experience improved",
        description: "Intelligent article recommendations that prioritize same-pillar content. Cleaner author cards with centered avatars. Removed emojis and personal names from article cards for a more professional feel.",
        categories: ["design", "engineering"],
        commits: 5,
      },
    ],
  },
  {
    date: "February 3–4, 2026",
    version: "1.5.0",
    changes: [
      {
        title: "SEO and meta overhaul",
        description: "Canonical URLs updated to www.craefto.com across all pages. Fixed OG meta tags for journal articles. Added yellow highlight component for article emphasis.",
        categories: ["engineering", "content"],
        commits: 4,
      },
    ],
  },
  {
    date: "January 29, 2026",
    version: "1.4.1",
    changes: [
      {
        title: "Mobile refinements",
        description: "Hidden border line above stats on mobile for cleaner layout. Tightened content-to-CTA spacing.",
        categories: ["design"],
        commits: 1,
      },
    ],
  },
  {
    date: "January 15, 2026",
    version: "1.4.0",
    milestone: "Case Studies Launch",
    changes: [
      {
        title: "Real project imagery",
        description: "Added real images for TACTIX, NUU, Fontkin, and GlobFam case studies. All compressed with 92% quality for fast loading. Interactive logo component for GlobFam.",
        categories: ["design", "content"],
        commits: 10,
      },
      {
        title: "Services bento grid",
        description: "Redesigned the services page with a bento grid layout. Tighter spacing between sections for a more editorial flow.",
        categories: ["design"],
        commits: 3,
      },
      {
        title: "Editorial typography",
        description: "Overhauled the article reading experience with refined editorial typography. Removed drop caps, cleaned up em dashes from copy.",
        categories: ["design", "content"],
        commits: 3,
      },
    ],
  },
  {
    date: "January 14, 2026",
    version: "1.3.0",
    milestone: "Journal & Content Engine",
    changes: [
      {
        title: "AI-powered content engine",
        description: "Launched the journal with MDX-based articles, pillar categories (Engineering, Design, Product), and automated content generation pipeline. Full Journal page redesign.",
        categories: ["engineering", "content", "platform"],
        commits: 3,
      },
      {
        title: "Mobile optimization",
        description: "Performance pass across all pages. Optimized images, improved responsive layouts, fixed favicon display for Firefox and Safari.",
        categories: ["engineering", "design"],
        commits: 3,
      },
    ],
  },
  {
    date: "January 12–13, 2026",
    version: "1.2.0",
    changes: [
      {
        title: "Admin intelligence dashboard",
        description: "Added CRM admin dashboard with lead management, analytics, and AI-powered intelligence features for tracking business growth.",
        categories: ["engineering", "platform"],
        commits: 3,
      },
      {
        title: "Approach section elevated",
        description: "Redesigned the home page Approach & Process section with award-winning 2026 animation patterns. Streamlined for single viewport impact.",
        categories: ["design"],
        commits: 3,
      },
    ],
  },
  {
    date: "January 9–10, 2026",
    version: "1.1.0",
    milestone: "3D Hero Launch",
    changes: [
      {
        title: "Morphing metaballs hero",
        description: "Added a 3D morphing metaballs animation to the hero section. Dynamic text color inversion based on metaball overlap. Mobile-responsive with mathematical position tracking. Sage green accent color integration.",
        categories: ["design", "engineering"],
        commits: 14,
      },
      {
        title: "Design system foundations",
        description: "Simplified Section and Container components. Established the component architecture that powers every page. Improved content structure based on Awwwards research.",
        categories: ["engineering", "design"],
        commits: 4,
      },
    ],
  },
  {
    date: "January 9, 2026",
    version: "1.0.0",
    milestone: "Initial Launch",
    changes: [
      {
        title: "Craefto.com goes live",
        description: "Complete landing page with case studies, services, process, and contact sections. Built with Next.js 15, Tailwind CSS, Framer Motion, and the Paper & Ink design system. \"Built to compound.\"",
        categories: ["design", "engineering", "branding"],
        commits: 2,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: ChangeCategory }) {
  const config = categoryConfig[category];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase font-mono tracking-[0.06em] ${config.color}`}>
      {config.label}
    </span>
  );
}

function VersionBadge({ version }: { version: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium text-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent))]/10">
      v{version}
    </span>
  );
}

function TimelineEntry({ entry }: { entry: ChangelogEntry }) {
  const hasMilestone = !!entry.milestone;

  return (
    <AnimatedSection>
      <div className="changelog-entry relative grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8">
        {/* Date column: stays beside the entry while you read it; its dot
            fills in as the entry arrives (no timeline line). */}
        <div className="md:text-right md:pr-8">
          <div className="relative md:sticky md:top-28">
            <span className="entry-dot hidden md:block absolute -right-[37px] top-[6px] w-2.5 h-2.5 rounded-full bg-[hsl(var(--color-accent))]" aria-hidden="true" />
            <p className="font-mono text-sm text-[hsl(var(--color-foreground-muted))] tracking-tight">
              {entry.date}
            </p>
            {entry.version && (
              <div className="mt-2">
                <VersionBadge version={entry.version} />
              </div>
            )}
          </div>
        </div>

        {/* Content column */}
        <div className="md:pl-8">
          {hasMilestone && (
            <div className="mb-4">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-[hsl(var(--color-foreground))]">
                {entry.milestone}
              </h3>
            </div>
          )}

          <div className="space-y-4">
            {entry.changes.map((change, i) => (
              <div
                key={i}
                className="group rounded-2xl bg-[hsl(var(--color-background-subtle))] p-6 transition-colors duration-300 hover:bg-[hsl(var(--color-accent-subtle))]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-[hsl(var(--color-foreground))]">
                    {change.title}
                  </h4>
                  {change.commits && (
                    <span className="font-mono text-[11px] text-[hsl(var(--color-foreground-subtle))] bg-[hsl(var(--color-background-subtle))] px-2 py-0.5 rounded">
                      {change.commits} commit{change.commits !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--color-foreground-muted))] leading-relaxed mb-3">
                  {change.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {change.categories.map((cat) => (
                    <CategoryPill key={cat} category={cat} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

// Stats computed from changelog data
const totalEntries = changelog.reduce((acc, entry) => acc + entry.changes.length, 0);
const totalCommits = changelog.reduce(
  (acc, entry) => acc + entry.changes.reduce((a, c) => a + (c.commits || 0), 0),
  0
);
const milestoneCount = changelog.filter((e) => e.milestone).length;

export default function ChangelogPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="sm" className="pb-12 md:pb-20">
            <Container>
              <div className="max-w-3xl">
                <nav className="mb-6 md:mb-4" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </Link>
                    </li>
                    <li><span className="mx-2">/</span></li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium">Changelog</li>
                  </ol>
                </nav>

                <h1 className="font-semibold tracking-tight mb-4"><RevealText text={"Changelog"} mode="load" /></h1>
                <HeroText delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-xl">
                    Every improvement, feature, and refinement we ship. Building in public since January 2026.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* Stats bar */}
          <Section spacing="lg" className="pt-0 md:pt-0">
            <Container>
              <AnimatedSection>
                <div className="flex flex-wrap gap-6 md:gap-10 pb-8 border-b border-[hsl(var(--color-border))]">
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[hsl(var(--color-foreground))]">{totalCommits}+</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mt-0.5">Commits</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[hsl(var(--color-foreground))]">{totalEntries}</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mt-0.5">Updates</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[hsl(var(--color-foreground))]">{milestoneCount}</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mt-0.5">Milestones</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[hsl(var(--color-accent))]">v{changelog[0].version}</p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))] uppercase font-mono tracking-[0.06em] mt-0.5">Latest</p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Timeline */}
              <div className="mt-10 md:mt-14 space-y-8 md:space-y-12">
                {changelog.map((entry) => (
                  <TimelineEntry
                    key={entry.date}
                    entry={entry}
                  />
                ))}
              </div>
            </Container>
          </Section>

          {/* CTA */}
          <Section spacing="lg" className="pt-8 md:pt-12">
            <Container>
              <AnimatedSection variant="scaleIn">
                <div className="rounded-2xl bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] p-8 sm:p-10 lg:p-12">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="max-w-xl">
                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[hsl(var(--color-foreground))] mb-2"><RevealText text={"Want to see what we can build for you?"} /></h2>
                      <p data-ink className="text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                        Every line in this changelog is proof of how we work: iterative, precise, and always improving.
                      </p>
                    </div>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[hsl(var(--color-accent))] text-white font-medium text-sm hover:bg-[hsl(var(--color-accent-hover))] transition-colors flex-shrink-0"
                    >
                      Start a project
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
