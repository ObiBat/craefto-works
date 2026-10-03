/* eslint-disable @next/next/no-img-element -- printed to PDF: the generator
   serves these images resized for print, so they skip next/image. */

import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { MARK_PATH } from "@/components/ui/logo-paths";
import { capabilities, capabilityName, capabilityPrices, engagements, type CapabilityId } from "@/content/capabilities";
import { caseStudies, type CaseStudy } from "@/content/case-studies";
import { shapes, stages } from "@/content/process";
import { beliefs, capabilityIcons, commitments, startSteps, studioFacts, studioStory } from "@/content/studio";
import { team } from "@/content/team";
import { siteConfig } from "@/lib/constants";
import { aiAutomationProject, formatPrice, monthlyPlans, priceFor, weeksLabel, type PriceRange } from "@/lib/pricing";
import "./profile.css";

// The company profile, as A4 landscape sheets. scripts/company-profile.mjs
// prints this page to public/craefto-works-company-profile.pdf; it exists
// only in development. Every claim comes from the site's own sources: the
// capabilities, case studies, process, prices, team and the About page's
// facts and commitments.

export const metadata: Metadata = {
  title: { absolute: "Craefto Works · Company Profile 2026" },
  robots: { index: false, follow: false },
};

const YEAR = 2026;
/** The 3D form from the home page, captured by the generator. */
const FORM = "/images/brand/craefto-form.png";

const aud = (amount: number) => `A${formatPrice(amount)}`;
const range = (price: PriceRange) => `${aud(price.min)} to ${aud(price.max)}`;
const study = (slug: string) => caseStudies.find((item) => item.slug === slug) as CaseStudy;

/** One picture per capability, from the work that capability page lists. */
const capabilityImage: Record<CapabilityId, { src: string; caption: string; position?: string }> = {
  brand: { src: "/images/projects/globfam/globfam-thumb.jpg", caption: "GlobFam" },
  product: { src: "/images/projects/fx-foundations/fx-foundations-hero.jpg", caption: "FX Foundations", position: "40% 50%" },
  systems: { src: "/images/projects/artisan/artisan-gallery-02.jpg", caption: "Artisan", position: "50% 45%" },
  media: { src: "/images/projects/nowuknow/nowuknow-04.jpg", caption: "Nowuknow", position: "50% 38%" },
  growth: { src: "/images/projects/artisan/artisan-gallery-01.jpg", caption: "Artisan" },
};

/** The client case studies with a page each, and how each page is laid out. */
const featured: { slug: string; images: { src: string; position?: string }[]; layout: "image-left" | "image-right" }[] = [
  { slug: "tav-partners", images: [{ src: "/images/projects/tav-partners/tav-partners-home-in-hands.jpg" }], layout: "image-left" },
  { slug: "mng-steel", images: [{ src: "/images/projects/mng-steel/mng-steel-gallery-02.jpg" }], layout: "image-right" },
  {
    slug: "globfam",
    images: [{ src: "/images/projects/globfam/globfam-gallery-01.jpg" }, { src: "/images/projects/globfam/globfam-gallery-02.jpg" }],
    layout: "image-left",
  },
  {
    slug: "nowuknow",
    images: [
      { src: "/images/projects/nowuknow/nowuknow-01.jpg" },
      { src: "/images/projects/nowuknow/nowuknow-10.jpg" },
      { src: "/images/projects/nowuknow/nowuknow-14.jpg" },
    ],
    layout: "image-right",
  },
];

/** The rest of the work, as cards. */
const moreWork: { slug: string; src: string }[] = [
  { slug: "nuu", src: "/images/projects/nuu/nuu-hero.jpg" },
  { slug: "artisan", src: "/images/projects/artisan/artisan-hero.jpg" },
  { slug: "fx-foundations", src: "/images/projects/fx-foundations/fx-foundations-thumb.jpg" },
  { slug: "tactix", src: "/images/projects/tactix/tactix-gallery-03.jpg" },
  { slug: "fontkin", src: "/images/projects/fontkin/fontkin-thumb.jpg" },
];

/** Portrait framing: where to centre each photo, and how far to zoom a full-length one. */
const teamFraming: Record<string, { position: string; zoom?: number }> = {
  "Enkhbold Altangerel": { position: "42% 40%" },
  "Sara Chinzorig": { position: "50% 30%", zoom: 1.75 },
};

// Page numbers for the contents, in sheet order.
const pages = (() => {
  let page = 3;
  const capabilitiesPage = page;
  page += 1 + capabilities.length;
  const processPage = page;
  page += 2;
  const togetherPage = page;
  page += 2;
  const workPage = page;
  page += 2 + featured.length + 1;
  const teamPage = page;
  page += 1;
  return { capabilities: capabilitiesPage, process: processPage, together: togetherPage, work: workPage, team: teamPage, start: page };
})();

const sections = [
  { number: "01", label: "Capabilities", page: pages.capabilities },
  { number: "02", label: "How we work", page: pages.process },
  { number: "03", label: "Working together", page: pages.together },
  { number: "04", label: "Selected work", page: pages.work },
  { number: "05", label: "The team", page: pages.team },
  { number: "06", label: "Start a project", page: pages.start },
];

// ---------------------------------------------------------------- pieces

function Mark({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" className={className} aria-hidden="true">
      <g transform="translate(0,400) scale(0.1,-0.1)" fill="currentColor">
        <path d={MARK_PATH} />
      </g>
    </svg>
  );
}

function Sheet({ tone = "light", children }: { tone?: "light" | "subtle" | "dark" | "accent"; children: ReactNode }) {
  const toneClass = { light: "", subtle: "cp-subtle", dark: "cp-dark", accent: "cp-accent-sheet" }[tone];
  return <section className={`cp-sheet ${toneClass}`}>{children}</section>;
}

/** The running header and footer of an inside page. */
function Running({ number, label }: { number?: string; label: string }) {
  return (
    <>
      <header className="cp-run">
        <span className="cp-mono">
          {number && <span className="cp-num">{number}</span>}
          {label}
        </span>
        <span className="cp-brand">
          <Mark size={13} />
          Craefto Works
        </span>
      </header>
      <footer className="cp-foot cp-mono">
        <span>Company profile {YEAR}</span>
        <span className="cp-pageno" />
      </footer>
    </>
  );
}

function Ticks({ items }: { items: string[] }) {
  return (
    <ul className="cp-ticks">
      {items.map((item) => (
        <li key={item}>
          <span className="cp-tick">
            <Check size={9} weight="bold" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Capability tags. Case studies list theirs by prominence, so they go unnumbered. */
function Tags({ ids, numbered = true }: { ids: CapabilityId[]; numbered?: boolean }) {
  return (
    <div className="cp-tags">
      {ids.map((id) => (
        <span key={id} className="cp-tag">
          {numbered && <b>{capabilities.find((capability) => capability.id === id)!.number}</b>}
          {capabilityName(id)}
        </span>
      ))}
    </div>
  );
}

function Picture({ src, position, caption, style }: { src: string; position?: string; caption?: string; style?: CSSProperties }) {
  return (
    <div className="cp-frame" style={style}>
      <img className="cp-img" src={src} alt="" style={position ? { objectPosition: position } : undefined} />
      {caption && <span className="cp-caption cp-mono">{caption}</span>}
    </div>
  );
}

function Portrait({ src, framing }: { src: string; framing?: { position: string; zoom?: number } }) {
  const position = framing?.position ?? "50% 30%";
  return (
    <div
      className="cp-frame"
      data-zoom={framing?.zoom ? "" : undefined}
      style={framing?.zoom ? ({ "--zoom": framing.zoom, "--focus": position } as CSSProperties) : undefined}
    >
      <img className="cp-img" src={src} alt="" style={{ objectPosition: position }} />
    </div>
  );
}

function Metrics({ project }: { project: CaseStudy }) {
  if (!project.metrics?.length) return null;
  return (
    <div className="cp-metrics">
      {project.metrics.slice(0, 4).map((metric) => (
        <div key={metric.label} className="cp-metric">
          <div className="cp-metric-value">{metric.value}</div>
          <div className="cp-metric-label">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

const host = (url?: string) => url?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** A case study's result for print: without the site's note on figures the repository doesn't hold. */
const resultForPrint = (project: CaseStudy) => project.outcome.replace(/\s*[^.]*not recorded in the repository\.$/, "");

// ---------------------------------------------------------------- sheets

function Cover() {
  return (
    <Sheet>
      <div className="cp-cover-top">
        <span className="cp-brand">
          <Mark size={22} />
          Craefto Works
        </span>
        <span className="cp-mono">Company profile · {YEAR}</span>
      </div>
      <img className="cp-cover-form" src={FORM} alt="" />
      <div className="cp-cover-body">
        <p className="cp-mono cp-accent" style={{ margin: 0 }}>
          Creative &amp; Technology Studio
        </p>
        <h1 className="cp-heading cp-cover-title">We build how businesses look, communicate and operate.</h1>
        <p className="cp-cover-caps">
          {capabilities.map((capability, index) => (
            <span key={capability.id} style={{ color: "inherit", margin: 0 }}>
              {index > 0 && <span>·</span>}
              {capability.name}
            </span>
          ))}
        </p>
      </div>
      <div className="cp-cover-bottom cp-mono">
        <span>Sydney, Australia · Working globally</span>
        <a className="cp-link" href={siteConfig.url}>
          craefto.com
        </a>
      </div>
    </Sheet>
  );
}

function Studio() {
  return (
    <Sheet>
      <Running label="The studio" />
      <div className="cp-body">
        <div className="cp-studio">
          <div className="cp-studio-left">
            <h2 className="cp-heading cp-title">We design it, build it and stay with it.</h2>
            <div className="cp-story">
              <p className="cp-text">
                <span className="cp-strong">{studioStory.founded}</span> {studioStory.belief}
              </p>
              <p className="cp-text">{studioStory.why}</p>
            </div>
            <p className="cp-pull">Built to compound: everything we make should keep paying off long after launch.</p>
          </div>
          <div>
            <div className="cp-facts">
              {studioFacts.map((fact) => (
                <div key={fact.label} className="cp-fact">
                  <div className="cp-fact-value">{fact.value}</div>
                  <div className="cp-mono cp-label" style={{ margin: "2mm 0 0" }}>
                    {fact.label}
                  </div>
                </div>
              ))}
            </div>
            <ol className="cp-contents">
              {sections.map((section) => (
                <li key={section.label}>
                  <span className="cp-mono cp-accent">{section.number}</span>
                  <span>{section.label}</span>
                  <span className="cp-mono" style={{ color: "var(--fg-subtle)" }}>
                    {String(section.page).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function CapabilitiesOverview() {
  return (
    <Sheet tone="subtle">
      <Running number="01" label="Capabilities" />
      <div className="cp-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16mm", alignItems: "end" }}>
          <h2 className="cp-heading cp-title">Five capabilities, one team.</h2>
          <p className="cp-text">
            Start with one and add others as you grow. Because it&apos;s one team, each piece builds on the last.
          </p>
        </div>
        <div className="cp-overview">
          {capabilities.map((capability) => {
            const CapabilityIcon = capabilityIcons[capability.id];
            return (
              <div key={capability.id} className="cp-card">
                <span className="cp-icon-tile">
                  <CapabilityIcon size={24} weight="duotone" />
                </span>
                <div>
                  <span className="cp-mono cp-accent">{capability.number}</span>
                  <h3 className="cp-heading cp-overview-name">{capability.name}</h3>
                  <p className="cp-small">{capability.scope}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cp-combos">
          {engagements.map((engagement) => (
            <div key={engagement.title}>
              <p className="cp-combo-title">{engagement.title}</p>
              <p className="cp-small" style={{ marginBottom: "3mm" }}>
                {engagement.description}
              </p>
              <Tags ids={engagement.capabilities} />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function CapabilityPage({ id }: { id: CapabilityId }) {
  const capability = capabilities.find((item) => item.id === id)!;
  const image = capabilityImage[id];
  return (
    <Sheet>
      <Running number="01" label="Capabilities" />
      <div className="cp-body">
        <div className="cp-capability">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="cp-capability-head">
              <span className="cp-capability-number">{capability.number}</span>
              <h2 className="cp-heading cp-capability-name">{capability.name}</h2>
            </div>
            <p className="cp-lead">{capability.summary}</p>
            <p className="cp-text" style={{ marginTop: "4mm" }}>
              {capability.description}
            </p>
            <div className="cp-capability-cols">
              <div>
                <p className="cp-mono cp-label">What we deliver</p>
                <Ticks items={capability.deliverables} />
              </div>
              <div>
                <p className="cp-mono cp-label">Investment</p>
                {capabilityPrices(capability).map((price) => (
                  <div key={price.service} className="cp-price">
                    <span className="cp-small">{price.label}</span>
                    <span className="cp-price-amount">{range(price)}</span>
                    <span className="cp-mono" style={{ color: "var(--fg-subtle)" }}>
                      {weeksLabel(price)}
                    </span>
                  </div>
                ))}
                <p className="cp-small" style={{ color: "var(--fg-subtle)" }}>
                  AUD, before GST. Or as part of a monthly plan.
                </p>
              </div>
            </div>
            <div className="cp-brief">
              <p className="cp-mono cp-label">When you&apos;d call us</p>
              <p className="cp-brief-quote">{capability.example}</p>
            </div>
          </div>
          <div className="cp-capability-side">
            <Picture src={image.src} position={image.position} caption={image.caption} />
            <div>
              <p className="cp-mono cp-label">Work that shows it</p>
              <ul className="cp-work-list">
                {capability.work.map((work) => (
                  <li key={work.slug}>
                    <p className="cp-work-name">{work.project}</p>
                    <p className="cp-small">{work.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function Process() {
  return (
    <Sheet>
      <Running number="02" label="How we work" />
      <div className="cp-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16mm", alignItems: "end" }}>
          <h2 className="cp-heading cp-title">Six stages, shaped to the work.</h2>
          <p className="cp-text">{shapes.all} It starts with a free 30-minute call, and you get a fixed price before any work begins.</p>
        </div>
        <ol className="cp-stages">
          {stages.map((stage) => (
            <li key={stage.id}>
              <div className="cp-stage-marker">{stage.number}</div>
              <h3 className="cp-heading cp-stage-name">{stage.name}</h3>
              <p className="cp-small">{stage.purpose}</p>
            </li>
          ))}
        </ol>
        <div className="cp-beliefs">
          {beliefs.map((belief, index) => (
            <div key={belief.title} className="cp-card">
              <span className="cp-mono cp-accent">{String(index + 1).padStart(2, "0")}</span>
              <p className="cp-belief-title">{belief.title}</p>
              <p className="cp-small">{belief.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function Commitments() {
  return (
    <Sheet tone="subtle">
      <Running number="02" label="How we work" />
      <div className="cp-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16mm", alignItems: "end" }}>
          <h2 className="cp-heading cp-title">What you can count on.</h2>
          <p className="cp-text">The same commitments on every project, built into how we quote, bill and hand over.</p>
        </div>
        <div className="cp-commitments">
          {commitments.map((commitment) => {
            const CommitmentIcon = commitment.icon;
            return (
              <div key={commitment.title} className="cp-card">
                <span className="cp-icon-tile">
                  <CommitmentIcon size={24} weight="duotone" />
                </span>
                <div>
                  <p className="cp-card-title">{commitment.title}</p>
                  <p className="cp-small">{commitment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

function Projects() {
  return (
    <Sheet>
      <Running number="03" label="Working together" />
      <div className="cp-body">
        <div className="cp-split">
          <div className="cp-split-intro">
            <h2 className="cp-heading cp-title">Fixed-price projects.</h2>
            <p className="cp-text">
              Every project is scoped with you and priced in full before work begins, then paid in milestones as the work is
              delivered. These are our published ranges; your proposal gives one fixed price and a confirmed timeline.
            </p>
            <div className="cp-note">
              <p className="cp-mono cp-label">Good to know</p>
              <p className="cp-small">
                Prices are in Australian dollars, before GST. Running costs such as hosting, software and AI usage are separate
                from our fees.
              </p>
            </div>
          </div>
          <div className="cp-price-groups">
            {capabilities.map((capability) => (
              <div key={capability.id} className="cp-price-group">
                <div className="cp-price-group-name">
                  <span className="cp-mono cp-accent">{capability.number}</span>
                  {capability.name}
                </div>
                <div>
                  {capabilityPrices(capability).map((price) => (
                    <div key={price.service} className="cp-price-row">
                      <span>{price.label}</span>
                      <b>{range(price)}</b>
                      <span className="cp-mono" style={{ color: "var(--fg-subtle)" }}>
                        {weeksLabel(price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function Plans() {
  const ai = priceFor(aiAutomationProject.service)!;
  return (
    <Sheet tone="subtle">
      <Running number="03" label="Working together" />
      <div className="cp-body" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16mm", alignItems: "end", marginBottom: "8mm" }}>
          <h2 className="cp-heading cp-title">Monthly plans.</h2>
          <p className="cp-text">
            Studio time each month across all five capabilities, billed monthly in advance. We agree the priorities with you
            and plan the work within that budget.
          </p>
        </div>
        <div className="cp-plans" style={{ marginTop: "auto" }}>
          {monthlyPlans.map((plan) => (
            <div key={plan.id} className="cp-plan">
              <div className="cp-plan-head">
                <h3 className="cp-heading cp-plan-name">{plan.name}</h3>
                <p className="cp-small">{plan.bestFor}</p>
              </div>
              <div className="cp-plan-body">
                <div className="cp-plan-price">
                  {aud(plan.price)}
                  <small>a month</small>
                </div>
                <Ticks items={plan.includes} />
                <div className="cp-plan-foot">
                  <span className="cp-tag">
                    <b>01–05</b>All five capabilities
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cp-ai">
          <div>
            <p className="cp-mono" style={{ color: "rgb(253 252 250 / 0.6)", margin: "0 0 2mm" }}>
              One-off project
            </p>
            <h3 className="cp-heading" style={{ fontSize: "17pt", color: "var(--bg)", margin: "0 0 2mm" }}>
              {aiAutomationProject.name}
            </h3>
            <p className="cp-text">
              {aiAutomationProject.bestFor} {range(ai)}, {weeksLabel(ai)}.
            </p>
          </div>
          <Ticks items={aiAutomationProject.includes} />
        </div>
      </div>
    </Sheet>
  );
}

function CaseHero({ project, image }: { project: CaseStudy; image: string }) {
  return (
    <Sheet tone="dark">
      <div className="cp-hero-image">
        <img className="cp-img" src={image} alt="" />
      </div>
      <div className="cp-hero-shade" />
      <header className="cp-run" style={{ color: "#fff" }}>
        <span className="cp-mono">
          <span className="cp-num">04</span>
          Selected work
        </span>
        <span className="cp-brand">
          <Mark size={13} />
          Craefto Works
        </span>
      </header>
      <div className="cp-hero-text">
        <div>
          <span className="cp-mono" style={{ color: "rgb(255 255 255 / 0.72)" }}>
            {project.client} · {project.year}
          </span>
          <h2 className="cp-heading">{project.title}</h2>
        </div>
        <div style={{ display: "grid", gap: "4mm" }}>
          <p className="cp-lead">{project.description}</p>
          <Tags ids={project.capabilities} numbered={false} />
        </div>
      </div>
    </Sheet>
  );
}

function CaseDetail({ project, images }: { project: CaseStudy; images: string[] }) {
  return (
    <Sheet>
      <Running number="04" label="Selected work" />
      <div className="cp-body">
        <div className="cp-case cp-flip" style={{ gridTemplateColumns: "1fr 118mm" }}>
          <div className="cp-case-text">
            <span className="cp-mono cp-label">{project.industry}</span>
            <p className="cp-mono cp-label" style={{ color: "var(--accent)" }}>
              The brief
            </p>
            <p className="cp-text" style={{ marginBottom: "5mm" }}>
              {project.challenge}
            </p>
            <p className="cp-mono cp-label" style={{ color: "var(--accent)" }}>
              The result
            </p>
            <p className="cp-text">{resultForPrint(project)}</p>
            <Metrics project={project} />
          </div>
          <div className="cp-case-media" style={{ gridTemplateRows: "1fr 1fr" }}>
            {images.map((src) => (
              <Picture key={src} src={src} />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function CasePage({ project, images, layout }: { project: CaseStudy; images: { src: string; position?: string }[]; layout: "image-left" | "image-right" }) {
  const media = (
    <div
      className="cp-case-media"
      style={images.length === 3 ? { gridTemplateColumns: "1fr 1fr 1fr" } : { gridTemplateRows: `repeat(${images.length}, 1fr)` }}
    >
      {images.map((image) => (
        <Picture key={image.src} src={image.src} position={image.position} />
      ))}
    </div>
  );
  const text = (
    <div className="cp-case-text">
      <span className="cp-mono cp-label">
        {project.client} · {project.year}
      </span>
      <h2 className="cp-heading cp-title">{project.title}</h2>
      <p className="cp-lead">{project.description}</p>
      <Tags ids={project.capabilities} numbered={false} />
      <p className="cp-mono cp-label" style={{ color: "var(--accent)", marginTop: "6mm" }}>
        The result
      </p>
      <p className="cp-small">{resultForPrint(project)}</p>
      {project.liveUrl && (
        <a className="cp-link cp-mono" href={project.liveUrl} style={{ marginTop: "3mm", color: "var(--accent)" }}>
          {host(project.liveUrl)}
        </a>
      )}
      <Metrics project={project} />
    </div>
  );
  return (
    <Sheet>
      <Running number="04" label="Selected work" />
      <div className="cp-body">
        <div className={`cp-case ${layout === "image-right" ? "cp-flip" : ""}`} style={layout === "image-right" ? { gridTemplateColumns: "96mm 1fr" } : undefined}>
          {layout === "image-left" ? (
            <>
              {media}
              {text}
            </>
          ) : (
            <>
              {text}
              {media}
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function MoreWork() {
  return (
    <Sheet tone="subtle">
      <Running number="04" label="Selected work" />
      <div className="cp-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16mm", alignItems: "end" }}>
          <h2 className="cp-heading cp-title">More work, including our own products.</h2>
          <p className="cp-text">
            We build products of our own as well as for clients. They keep the studio sharp on the work clients hire us for, from
            3D on the web to the backends behind marketplaces.
          </p>
        </div>
        <div className="cp-more">
          {moreWork.map((item) => {
            const project = study(item.slug);
            const own = /^internal/i.test(project.client);
            return (
              <div key={item.slug} className="cp-more-item">
                <Picture src={item.src} />
                <span className="cp-mono" style={{ color: own ? "var(--accent)" : "var(--fg-subtle)" }}>
                  {own ? "Our product" : "Client"} · {project.year}
                </span>
                <h3 className="cp-heading cp-more-name">{project.title}</h3>
                <p className="cp-small">{project.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

function Team() {
  return (
    <Sheet>
      <Running number="05" label="The team" />
      <div className="cp-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16mm", alignItems: "end" }}>
          <h2 className="cp-heading cp-title">The people you&apos;ll work with.</h2>
          <p className="cp-text">A small team by design, so you work directly with the people doing the work.</p>
        </div>
        <div className="cp-team">
          {team.map((member) => (
            <div key={member.name}>
              {member.image && <Portrait src={member.image} framing={teamFraming[member.name]} />}
              <h3 className="cp-heading cp-team-name">{member.name}</h3>
              <p className="cp-mono cp-accent" style={{ margin: "0 0 1.6mm" }}>
                {member.role}
              </p>
              <p className="cp-small">{member.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function Start() {
  const bookingUrl = `https://cal.com/${siteConfig.calLink}`;
  return (
    <Sheet tone="accent">
      <header className="cp-run" style={{ color: "#fff" }}>
        <span className="cp-mono">
          <span className="cp-num">06</span>
          Start a project
        </span>
        <span className="cp-brand">
          <Mark size={13} />
          Craefto Works
        </span>
      </header>
      <footer className="cp-foot cp-mono">
        <span>Company profile {YEAR}</span>
        <span className="cp-pageno" />
      </footer>
      <div className="cp-body">
        <div className="cp-start">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2 className="cp-heading">Tell us what you&apos;re working on.</h2>
            <p className="cp-lead">
              You don&apos;t need a finished brief. Start with what you&apos;re thinking about, and we&apos;ll shape it together.
            </p>
            <div className="cp-contact">
              <div>
                <p className="cp-mono">Book a free 30-minute call</p>
                <a className="cp-contact-value" href={bookingUrl}>
                  cal.com/{siteConfig.calLink}
                </a>
              </div>
              <div>
                <p className="cp-mono">Email</p>
                <a className="cp-contact-value" href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              </div>
              <div>
                <p className="cp-mono">Website</p>
                <a className="cp-contact-value" href={siteConfig.url}>
                  craefto.com
                </a>
              </div>
              <div>
                <p className="cp-mono">Studio</p>
                <p className="cp-contact-value">Sydney, Australia</p>
              </div>
            </div>
          </div>
          <ol className="cp-steps">
            {startSteps.map((step, index) => (
              <li key={step.title}>
                <span className="cp-step-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="cp-step-title">{step.title}</p>
                  <p className="cp-step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Sheet>
  );
}

function BackCover() {
  return (
    <Sheet tone="dark">
      <div className="cp-back">
        <Mark size={58} />
        <h2 className="cp-heading">Craefto Works</h2>
        <p className="cp-mono" style={{ color: "rgb(253 252 250 / 0.6)", margin: 0 }}>
          Creative &amp; Technology Studio
        </p>
        <p className="cp-back-tagline">We build how businesses look, communicate and operate.</p>
        <a className="cp-link cp-mono" href={siteConfig.url} style={{ color: "rgb(253 252 250 / 0.6)", marginTop: "6mm" }}>
          craefto.com · {siteConfig.email}
        </a>
      </div>
    </Sheet>
  );
}

export default function CompanyProfile() {
  if (process.env.NODE_ENV === "production") notFound();
  const japanoma = study("japanoma");
  return (
    <main className="cp">
      <Cover />
      <Studio />
      <CapabilitiesOverview />
      {capabilities.map((capability) => (
        <CapabilityPage key={capability.id} id={capability.id} />
      ))}
      <Process />
      <Commitments />
      <Projects />
      <Plans />
      <CaseHero project={japanoma} image="/images/projects/japanoma/japanoma-devices.jpg" />
      <CaseDetail
        project={japanoma}
        images={["/images/projects/japanoma/japanoma-envelopes.jpg", "/images/projects/japanoma/japanoma-home-iphones.jpg"]}
      />
      {featured.map((item) => (
        <CasePage key={item.slug} project={study(item.slug)} images={item.images} layout={item.layout} />
      ))}
      <MoreWork />
      <Team />
      <Start />
      <BackCover />
    </main>
  );
}
