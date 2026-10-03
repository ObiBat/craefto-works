import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight, Code, Compass, FilmSlate, FlowArrow, PenNib, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { AnimatedSection, Badge, HeroText, PageTransition } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Glide } from "@/components/editorial/glide";
import { RevealText } from "@/components/editorial/reveal-text";
import { ScrollSpotlight } from "@/components/editorial/scroll-spotlight";
import { SectionIntro } from "@/components/editorial/section-intro";
import { StudioCta } from "@/components/sections/studio-cta";
import { capabilityName, type CapabilityId } from "@/content/capabilities";
import { roles } from "@/lib/careers";

// The studio as a place to work. The projects named here are case studies
// (content/case-studies.ts); the perks and principles are the studio's own.

const muted = "text-[hsl(var(--color-foreground-muted))]";

const disciplines: { icon: Icon; title: string; text: string; capabilities: CapabilityId[] }[] = [
  { icon: PenNib, title: "Designers", text: "Identities, interfaces and the design systems that hold them together.", capabilities: ["brand", "product"] },
  { icon: Code, title: "Developers", text: "Websites, apps and platforms, built to last and handed over properly.", capabilities: ["product", "systems"] },
  { icon: Compass, title: "Strategists", text: "Positioning, planning and campaigns that bring the right people in.", capabilities: ["brand", "growth"] },
  { icon: FilmSlate, title: "Filmmakers and photographers", text: "Shoots, edits and motion, made for where they will run.", capabilities: ["media"] },
  { icon: FlowArrow, title: "Technologists", text: "Automation, integrations and AI workflows that take work off a team.", capabilities: ["systems"] },
  { icon: Sparkle, title: "And more", text: "Writers, marketers, producers: anyone whose craft makes the work better.", capabilities: ["brand", "product", "systems", "media", "growth"] },
];

const principles = [
  { title: "Ship real work.", text: "No spec projects and no fake briefs. What you make goes live." },
  { title: "Trust taste over process.", text: "We hire people for their judgement, then let them use it." },
  { title: "Small team, loud voices.", text: "Every opinion shapes the work, whatever your craft." },
  { title: "Remote by default.", text: "Your best work happens where you feel best." },
];

const perks = [
  { label: "Flexible hours", detail: "Work around your energy, not a clock" },
  { label: "Remote first", detail: "Sydney, Melbourne, anywhere with WiFi" },
  { label: "Learning budget", detail: "Tools, courses, conferences on us" },
  { label: "Creative ownership", detail: "Your name on the work, your call on the craft" },
  { label: "No meeting culture", detail: "We write things down. Your calendar stays clean" },
  { label: "Modern tools", detail: "Figma, Adobe CC, the best gear for the job" },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="lg">
            <Container>
              <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-7">
                  <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                    Careers at Craefto Works
                  </p>
                  <h1 className="mb-0 font-semibold leading-[0.92] tracking-tight">
                    <RevealText text="Many crafts." mode="load" />
                    <br />
                    <span className="text-[hsl(var(--color-accent))]">
                      <RevealText text="One studio." mode="load" delay={2} />
                    </span>
                    <br />
                    <RevealText text="Join us." mode="load" delay={4} />
                  </h1>
                </div>
                <div className="lg:col-span-5">
                  <HeroText delay={0.15}>
                    <p className={`text-lg leading-relaxed ${muted}`}>
                      Craefto Works is a creative &amp; technology studio in Sydney. Designers, developers, strategists, filmmakers,
                      photographers and technologists work side by side on brand, product, systems, media and growth, often on the same
                      project.
                    </p>
                  </HeroText>
                  <HeroText delay={0.25}>
                    <p className="mt-8 flex items-center gap-3 text-sm font-medium text-[hsl(var(--color-foreground-muted))]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--color-accent))]" />
                      {roles.length} open {roles.length === 1 ? "role" : "roles"}
                      <span className="text-[hsl(var(--color-foreground-subtle))]">·</span>
                      Remote
                    </p>
                  </HeroText>
                </div>
              </div>
            </Container>
          </Section>

          {/* 01: why the studio works the way it does. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="01" label="The studio" title="One team, every craft" />
              <AnimatedSection delay={0.1}>
                <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-20">
                  <p className={`text-lg leading-relaxed ${muted}`}>
                    We bring brand, product, systems, media and growth under one roof, so the people who make each piece work together
                    from the first conversation. A designer, a developer and a filmmaker can share a project, and the work is better
                    for it.
                  </p>
                  <p className={`text-lg leading-relaxed ${muted}`}>
                    The work is varied and it ships. So far that has meant a brand system for a cross-border fintech, the automation
                    behind a property platform, a 3D chess learning platform and a street shoot for a Sydney event collective.
                  </p>
                </div>
              </AnimatedSection>
              <p
                data-ink
                className="mt-16 max-w-4xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight tracking-tight md:mt-24 md:text-5xl"
              >
                We set the direction together, then trust you with the craft.
              </p>
            </Container>
          </Section>

          {/* 02: who works here. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="02" label="Disciplines" title="Who you'd work with">
                Each craft leads where it&apos;s strongest, and every project draws on several.
              </SectionIntro>
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {disciplines.map((discipline) => {
                  const DisciplineIcon = discipline.icon;
                  return (
                    <li key={discipline.title} className="lit-card flex flex-col gap-10 rounded-3xl p-7">
                      <span className="icon-tile">
                        <DisciplineIcon size={30} weight="duotone" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-2">
                        <span className="lit-card-title font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                          {discipline.title}
                        </span>
                        <span className={`text-sm leading-relaxed ${muted}`}>{discipline.text}</span>
                        <span className="mt-2 font-mono text-xs text-[hsl(var(--color-accent))]">
                          {discipline.capabilities.length === 5 ? "All five capabilities" : discipline.capabilities.map(capabilityName).join(" · ")}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </Section>

          {/* 03: how the team works. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="03" label="How we work" title="Four principles" />
              <Glide bleed={20}>
                <ol className="mt-10">
                  {principles.map((principle, index) => (
                    <li
                      key={principle.title}
                      data-glide-item
                      className="grid gap-2 rounded-2xl py-7 md:grid-cols-[4rem_minmax(0,1.15fr)_minmax(0,1fr)] md:items-baseline md:gap-8"
                    >
                      <span className="font-mono text-sm text-[hsl(var(--color-accent))] tabular-nums" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p data-ink className="font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                        {principle.title}
                      </p>
                      <p className={`text-lg leading-relaxed ${muted}`}>{principle.text}</p>
                    </li>
                  ))}
                </ol>
              </Glide>
            </Container>
          </Section>

          {/* 04: open roles. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="04" label="Open roles" title="Current openings" />
              {roles.length > 0 ? (
                <Glide bleed={16}>
                  <ul className="mt-10">
                    {roles.map((role) => (
                      <li key={role.slug} data-glide-item className="rounded-2xl">
                        <Link href={`/careers/${role.slug}`} className="group flex flex-col gap-3 py-7 md:flex-row md:items-center md:justify-between md:gap-10">
                          <span className="flex min-w-0 flex-col gap-3">
                            <span className="flex flex-wrap items-center gap-3">
                              <Badge variant="accent">{role.department}</Badge>
                              <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                                {role.location} · {role.type}
                              </span>
                            </span>
                            <span className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-[hsl(var(--color-accent))] md:text-3xl">
                              {role.title}
                            </span>
                            <span className={`max-w-2xl leading-relaxed ${muted}`}>
                              {role.description.length > 180 ? `${role.description.slice(0, 180).trim()}…` : role.description}
                            </span>
                          </span>
                          <ArrowUpRight
                            size={22}
                            aria-hidden="true"
                            className="shrink-0 text-[hsl(var(--color-foreground-subtle))] transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[hsl(var(--color-accent))]"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Glide>
              ) : (
                <AnimatedSection delay={0.1}>
                  <div className="mt-10 flex flex-col items-start gap-6">
                    <p className={`text-lg ${muted}`}>No open roles right now, but we&apos;re always glad to hear from people with real craft.</p>
                    <Button asChild>
                      <Link href="/contact">Introduce yourself</Link>
                    </Button>
                  </div>
                </AnimatedSection>
              )}
            </Container>
          </Section>

          {/* 05: what working here includes. */}
          <Section spacing="lg">
            <Container>
              <SectionIntro number="05" label="What you get" title="How we look after the team" />
              <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {perks.map((perk, index) => (
                  <li key={perk.label} className="lit-card flex flex-col gap-8 rounded-3xl p-7">
                    <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex flex-col gap-2">
                      <span className="lit-card-title font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">{perk.label}</span>
                      <span className={`text-sm leading-relaxed ${muted}`}>{perk.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>

          <StudioCta
            eyebrow="Open application"
            title="Don't see your role? Introduce yourself."
            text="Designers, developers, strategists, filmmakers, photographers, technologists: if you have sharp taste and real craft, tell us what you do best and show us something you've made."
            primary={{ kind: "link", href: "/contact", label: "Introduce yourself" }}
            secondary={{ href: "/work", label: "See our work" }}
          />
          <ScrollSpotlight selector=".lit-card" media="(hover: none) and (max-width: 767px)" />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
