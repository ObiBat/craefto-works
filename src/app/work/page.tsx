"use client";

import Link from "next/link";
import Image from "next/image";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Badge, Separator, PageTransition, AnimatedSection, StaggeredGrid, StaggeredItem, HeroText, ProjectImagePlaceholder } from "@/components/ui";

// Projects data - in production, this would come from a CMS or data file
const projects = [
  {
    slug: "mng-steel",
    title: "MNG Steel",
    description: "Trilingual website, brand mark and a private DBM financing dossier for a Mongolian grinding-ball plant.",
    category: "Web",
    industry: "Industrial Manufacturing / Mining Supply",
    year: 2026,
    featured: false,
    accentColor: "16 100% 56%",
    thumbnail: "/images/projects/mng-steel/mng-steel-thumb.jpg",
  },
  {
    slug: "tav-partners",
    title: "TAV & Partners",
    description: "A typography-led static site and brand system for a new Sydney chartered accounting and tax advisory firm.",
    category: "Web",
    industry: "Professional Services / Accounting and Tax Advisory",
    year: 2026,
    featured: false,
    accentColor: "224 48% 21%",
    thumbnail: "/images/projects/tav-partners/tav-partners-thumb.jpg",
  },
  {
    slug: "japanoma",
    title: "JapanoMa",
    description: "A decision-aid platform helping Australian skiers weigh a Japan snow-country home base, from quiz to purchase.",
    category: "Product",
    industry: "Property / Cross-border Lifestyle Real Estate",
    year: 2026,
    featured: false,
    accentColor: "211 33% 36%",
    thumbnail: "/images/projects/japanoma/japanoma-thumb.jpg",
  },
  {
    slug: "artisan",
    title: "Artisan",
    description: "Crew OS and spot marketplace for construction labour, built as a mobile app, site, deck and backend.",
    category: "Product",
    industry: "Construction / Workforce Marketplace",
    year: 2026,
    featured: false,
    accentColor: "25 95% 53%",
    thumbnail: "/images/projects/artisan/artisan-thumb.jpg",
  },
  {
    slug: "fx-foundations",
    title: "FX Foundations",
    description: "A bilingual forex education platform with 163 researched lessons, a trading simulator and Pro plans.",
    category: "Product",
    industry: "Fintech / Trading Education",
    year: 2026,
    featured: false,
    accentColor: "153 40% 30%",
    thumbnail: "/images/projects/fx-foundations/fx-foundations-thumb.jpg",
  },
  {
    slug: "fontkin",
    title: "Fontkin",
    description: "Professional font pairing lab for designers & developers with curated combinations and one-click exports.",
    category: "Web",
    industry: "Design Tools",
    year: 2026,
    featured: true,
    accentColor: "0 0% 6%",
    thumbnail: "/images/projects/fontkin/fontkin-thumb.jpg",
  },
  {
    slug: "globfam",
    title: "GlobFam",
    description: "Cross-border family finance platform with premium branding & motion design system.",
    category: "Brand",
    industry: "Fintech / Family Finance",
    year: 2025,
    featured: true,
    accentColor: "195 78% 38%",
    thumbnail: "/images/projects/globfam/globfam-thumb.jpg",
  },
  {
    slug: "tactix",
    title: "TACTIX",
    description: "The world's most beautiful 3D chess learning platform with AI-powered coaching.",
    category: "Product",
    industry: "EdTech / Gaming",
    year: 2025,
    featured: true,
    accentColor: "45 61% 52%",
    thumbnail: "/images/projects/tactix/tactix-thumb.jpg",
  },
  {
    slug: "nuu",
    title: "NUU",
    description: "AI-powered property matching platform for the Australian rental market.",
    category: "SaaS",
    industry: "PropTech / Real Estate",
    year: 2025,
    featured: true,
    accentColor: "18 100% 50%",
    thumbnail: "/images/projects/nuu/nuu-thumb.jpg",
  },
];

export default function WorkPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {/* Hero */}
          <Section spacing="sm" className="pb-8 md:pb-6">
            <Container>
              <div className="max-w-3xl">
                {/* Breadcrumb */}
                <nav className="mb-6 md:mb-4" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                    <li>
                      <a href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                        Home
                      </a>
                    </li>
                    <li>
                      <span className="mx-2">/</span>
                    </li>
                    <li className="text-[hsl(var(--color-foreground))] font-medium">Work</li>
                  </ol>
                </nav>

                <HeroText>
                  <h1 className="font-semibold tracking-tight mb-4">
                    Case studies
                  </h1>
                </HeroText>
                <HeroText delay={0.1}>
                  <p className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                    A selection of projects across brand, web, and product. Each one
                    built as a system, not a one-off.
                  </p>
                </HeroText>
              </div>
            </Container>
          </Section>

          {/* Projects Grid */}
          <Section spacing="md" className="pt-0 pb-16 md:pb-20">
            <Container>
              <Separator className="mb-12 md:mb-8" />

              <StaggeredGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {projects.map((project) => (
                  <StaggeredItem key={project.slug}>
                    <Link
                      href={`/work/${project.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                        {/* Image */}
                        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                          {project.thumbnail ? (
                            <Image
                              src={project.thumbnail}
                              alt={`${project.title} thumbnail`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : (
                            <ProjectImagePlaceholder
                              projectName={project.title}
                              imageType="thumb"
                              accentColor={project.accentColor}
                            />
                          )}
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                          {/* Category & Year */}
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="bg-white/15 text-white border-white/20 backdrop-blur-sm">
                              {project.category}
                            </Badge>
                            <span className="text-sm text-white/60">{project.year}</span>
                          </div>

                          {/* Title with animated underline */}
                          <p className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2 relative inline-block" style={{ color: '#ffffff' }}>
                            {project.title}
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                          </p>

                          {/* Description */}
                          <p className="text-sm sm:text-base text-white/70 leading-relaxed line-clamp-2 mb-3">
                            {project.description}
                          </p>

                          {/* Industry */}
                          <p className="text-xs text-white/50 uppercase font-mono tracking-[0.06em]">
                            {project.industry}
                          </p>

                          {/* View indicator */}
                          <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </StaggeredItem>
                ))}
              </StaggeredGrid>

              {/* Coming Soon Note */}
              <AnimatedSection className="mt-16" variant="fadeIn">
                <div className="p-8 rounded-xl border border-dashed border-[hsl(var(--color-border))] text-center">
                  <p className="text-[hsl(var(--color-foreground-muted))]">
                    More case studies coming soon. We&apos;re currently documenting
                    our recent projects.
                  </p>
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
