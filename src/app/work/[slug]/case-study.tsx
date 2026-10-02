"use client";

import Link from "next/link";
import Image from "next/image";
import { createContext, useContext, useState } from "react";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Badge, Separator, PageTransition, AnimatedSection, HeroText, StaggeredGrid, StaggeredItem, ProjectImagePlaceholder, InteractiveLogo, BrandMoment } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { cn } from "@/lib/utils";

import { caseStudies, getCaseStudy, PROJECTS_WITH_REAL_IMAGES, type CaseStudy, type PhotoSet } from "@/content/case-studies";

// Blurred previews keyed by image path (see npm run images:placeholders).
const BlurContext = createContext<Record<string, string>>({});

// Section labels and headings: for a build, and for a photo shoot.
const STORY = {
  build: {
    challenge: ["01 / The Challenge", "Understanding the problem"],
    approach: ["02 / The Approach", "How we tackled it"],
    solution: ["03 / The Solution", "What we built"],
    outcome: ["04 / The Outcome", "Results & impact"],
    stack: "Tech Stack",
  },
  shoot: {
    challenge: ["01 / The Brief", "What the shoot was for"],
    approach: ["02 / On Location", "How we shot it"],
    solution: ["03 / The Edit", "How it was finished"],
    outcome: ["04 / The Set", "What was delivered"],
    stack: "Kit",
  },
} as const;

// Helper component to render real image or placeholder
function ProjectImage({
  project,
  src,
  alt,
  caption,
  imageType = "gallery",
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px",
}: {
  project: CaseStudy;
  src?: string;
  alt?: string;
  caption?: string;
  imageType?: "hero" | "gallery" | "thumb";
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const blur = useContext(BlurContext)[src ?? ""];
  const hasRealImages =
    PROJECTS_WITH_REAL_IMAGES.includes(project.slug) &&
    src?.includes("/images/projects/") &&
    !src.endsWith(".mp4");

  if (hasRealImages && src && !failed) {
    return (
      <Image
        src={src}
        alt={alt || `${project.title} ${imageType}`}
        fill
        className={`object-cover ${className}`}
        sizes={sizes}
        placeholder={blur ? "blur" : "empty"}
        blurDataURL={blur}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <ProjectImagePlaceholder
      projectName={project.title}
      imageType={imageType}
      caption={caption || ""}
      accentColor={project.accentColor}
    />
  );
}

/**
 * A photo shoot's frames by setup, near-identical takes together: side by
 * side from small screens up, and a row to swipe through on phones.
 */
function PhotoSets({ project, sets }: { project: CaseStudy; sets: PhotoSet[] }) {
  if (sets.length === 0) return null;
  return (
    <Section spacing="sm">
      <Container>
        <div className="flex flex-col gap-16 md:gap-24">
          {sets.map((set) => {
            const count = set.images.length;
            return (
              <AnimatedSection key={set.title}>
                <figure className={cn(count === 1 && "mx-auto max-w-lg", count === 2 && "sm:mx-auto sm:max-w-3xl")}>
                  <div
                    className={cn(
                      count === 1
                        ? "grid"
                        : "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0",
                      count === 2 && "sm:grid-cols-2",
                      count >= 3 && "sm:grid-cols-3"
                    )}
                  >
                    {set.images.map((image) => (
                      <div
                        key={image.src}
                        className={cn(
                          "relative aspect-[2/3] overflow-hidden rounded-xl",
                          count > 1 && "w-[78%] shrink-0 snap-center sm:w-auto"
                        )}
                      >
                        <ProjectImage
                          project={project}
                          src={image.src}
                          alt={image.alt}
                          sizes="(max-width: 639px) 78vw, (max-width: 1280px) 34vw, 420px"
                        />
                      </div>
                    ))}
                  </div>
                  <figcaption className="mt-4 flex flex-col gap-1 text-sm sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                      {set.title}
                    </span>
                    <span className="text-[hsl(var(--color-foreground-muted))]">{set.caption}</span>
                  </figcaption>
                </figure>
              </AnimatedSection>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

export function CaseStudyView({ slug, placeholders = {} }: { slug: string; placeholders?: Record<string, string> }) {
  // The server page only renders known slugs (dynamicParams = false).
  const project = getCaseStudy(slug) as CaseStudy;

  // A photo shoot swaps the screen-shaped image slots for its photo sets.
  const photoSets = project.photoSets ?? [];
  const isShoot = photoSets.length > 0;
  const setsAfter = (placement: PhotoSet["placement"]) => photoSets.filter((set) => set.placement === placement);
  const story = STORY[isShoot ? "shoot" : "build"];
  const liveLabel = project.liveLabel ?? "Visit live site";
  // 4:3 device mockups keep their shape in the wide frames (see .mockup-frame).
  const mockups = project.imageAspect === "4/3";

  // Only cycle through featured (real) projects for "next project"
  const featuredProjects = caseStudies.filter((p) => p.featured);
  const currentFeaturedIndex = featuredProjects.findIndex((p) => p.slug === slug);
  const nextProject = currentFeaturedIndex !== -1
    ? featuredProjects[(currentFeaturedIndex + 1) % featuredProjects.length]
    : featuredProjects[0];

  return (
    <BlurContext.Provider value={placeholders}>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-16">
          {/* Back Link */}
          <Section spacing="xs">
            <Container>
              <HeroText>
                <Link
                  href="/work"
                  className="inline-flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to work
                </Link>
              </HeroText>
            </Container>
          </Section>

          {/* Hero Header */}
          <Section spacing="sm">
            <Container>
              <div className="max-w-4xl">
                <HeroText>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge>{project.category}</Badge>
                    <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{project.year}</span>
                  </div>
                </HeroText>
                <HeroText delay={0.05}>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
                    <RevealText text={project.title} mode="load" />
                  </h1>
                </HeroText>
                <HeroText delay={0.1}>
                  <p className="text-xl sm:text-2xl text-[hsl(var(--color-foreground-muted))] leading-relaxed max-w-3xl">
                    {project.description}
                  </p>
                </HeroText>
                {project.liveUrl && (
                  <HeroText delay={0.15}>
                    <div className="mt-8">
                      <Button size="lg" asChild>
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <span className="btn-text-wrapper">
                            <span className="btn-text-primary">
                              {liveLabel}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                            <span className="btn-text-secondary" aria-hidden="true">
                              {project.liveLabel ?? "View project"}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                          </span>
                        </a>
                      </Button>
                    </div>
                  </HeroText>
                )}
              </div>
            </Container>
          </Section>

          {/* Hero Image, or a shoot's opening set */}
          {isShoot ? (
            <PhotoSets project={project} sets={setsAfter("hero")} />
          ) : (
            <Section spacing="sm">
              <Container>
                <AnimatedSection variant="scaleIn">
                  <div className={cn(mockups ? "mockup-frame aspect-[4/3]" : "aspect-[16/9]", "rounded-2xl overflow-hidden relative")}>
                    <ProjectImage
                      project={project}
                      src={project.heroImage}
                      alt={project.heroAlt ?? `${project.title} hero`}
                      caption="Main project showcase"
                      imageType="hero"
                    />
                  </div>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* Project Metadata */}
          <Section spacing="md">
            <Container>
              <AnimatedSection>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-6 sm:p-8 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
                  <div>
                    <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-2">Client</p>
                    <p className="font-medium">{project.client}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-2">Industry</p>
                    <p className="font-medium">{project.industry}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-2">Timeline</p>
                    <p className="font-medium">{project.timeline}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-2">Year</p>
                    <p className="font-medium">{project.year}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-2">Services</p>
                    <p className="font-medium">{project.services.join(" · ")}</p>
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>

          {/* The Challenge */}
          <Section spacing="md">
            <Container size="md">
              <AnimatedSection>
                <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-4">{story.challenge[0]}</p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6"><RevealText text={story.challenge[1]} /></h2>
                <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                  {project.challenge}
                </p>
              </AnimatedSection>
            </Container>
          </Section>

          {/* Gallery Image */}
          {isShoot ? (
            <PhotoSets project={project} sets={setsAfter("challenge")} />
          ) : (
            <Section spacing="sm">
              <Container>
                <AnimatedSection variant="scaleIn">
                  <div data-unmask className={cn(mockups ? "mockup-frame aspect-[4/3]" : "aspect-[16/9]", "rounded-xl overflow-hidden relative")}>
                    <ProjectImage
                      project={project}
                      src={project.gallery[0]?.src}
                      alt={project.gallery[0]?.alt || "Project gallery"}
                      caption={project.gallery[0]?.caption || "Challenge context visualization"}
                      imageType="gallery"
                    />
                  </div>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* The Approach */}
          <Section spacing="md">
            <Container size="md">
              <AnimatedSection>
                <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-4">{story.approach[0]}</p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6"><RevealText text={story.approach[1]} /></h2>
                <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                  {project.approach}
                </p>
              </AnimatedSection>
            </Container>
          </Section>

          {/* Image Grid */}
          {isShoot ? (
            <PhotoSets project={project} sets={setsAfter("approach")} />
          ) : (
            <Section spacing="sm">
              <Container>
                <AnimatedSection>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div data-unmask className="aspect-[4/3] rounded-xl overflow-hidden relative">
                      <ProjectImage
                        project={project}
                        src={project.gallery[1]?.src}
                        alt={project.gallery[1]?.alt || "Design process"}
                        caption={project.gallery[1]?.caption || "Design process & iterations"}
                        imageType="gallery"
                      />
                    </div>
                    <div data-unmask className="aspect-[4/3] rounded-xl overflow-hidden relative">
                      {/* Interactive logo for GlobFam, regular image for others */}
                      {project.slug === "globfam" ? (
                        <InteractiveLogo />
                      ) : (
                        <ProjectImage
                          project={project}
                          src={project.gallery[2]?.src}
                          alt={project.gallery[2]?.alt || "Implementation"}
                          caption={project.gallery[2]?.caption || "Implementation details"}
                          imageType="gallery"
                        />
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* Brand moment: the client's own logo entrance, ported from its site */}
          {(project.slug === "tav-partners" || project.slug === "japanoma" || project.slug === "artisan") && (
            <Section spacing="sm">
              <Container>
                <AnimatedSection>
                  <BrandMoment slug={project.slug} />
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* The Solution */}
          <Section spacing="md">
            <Container size="md">
              <AnimatedSection>
                <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-4">{story.solution[0]}</p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6"><RevealText text={story.solution[1]} /></h2>
                <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                  {project.solution}
                </p>
              </AnimatedSection>
            </Container>
          </Section>

          {/* Tech Stack */}
          <Section spacing="sm">
            <Container>
              <AnimatedSection>
                <div className="p-6 sm:p-8 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
                  <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-4">{story.stack}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 text-sm font-medium rounded-full bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </Container>
          </Section>

          {/* Full Width Image */}
          {isShoot ? (
            <PhotoSets project={project} sets={setsAfter("solution")} />
          ) : (
            <Section spacing="sm">
              <Container>
                <AnimatedSection variant="scaleIn">
                  {mockups && project.gallery[3] ? (
                    <div data-unmask className="mockup-frame aspect-[4/3] rounded-xl overflow-hidden relative">
                      <ProjectImage
                        project={project}
                        src={project.gallery[3].src}
                        alt={project.gallery[3].alt}
                        caption={project.gallery[3].caption || "Full showcase view"}
                        imageType="gallery"
                      />
                    </div>
                  ) : (
                    <div data-unmask className="aspect-[21/9] rounded-xl overflow-hidden relative">
                      <ProjectImage
                        project={project}
                        src={project.heroImage}
                        alt={project.heroAlt ?? `${project.title} showcase`}
                        caption="Full showcase view"
                        imageType="hero"
                      />
                    </div>
                  )}
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* The Outcome */}
          <Section spacing="md">
            <Container size="md">
              <AnimatedSection>
                <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] mb-4">{story.outcome[0]}</p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6"><RevealText text={story.outcome[1]} /></h2>
                <p data-ink className="text-lg text-[hsl(var(--color-foreground-muted))] leading-relaxed">
                  {project.outcome}
                </p>
              </AnimatedSection>
            </Container>
          </Section>

          {isShoot && <PhotoSets project={project} sets={setsAfter("outcome")} />}

          {/* Metrics */}
          {project.metrics && project.metrics.length > 0 && (
            <Section spacing="sm">
              <Container>
                <AnimatedSection>
                  <StaggeredGrid className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {project.metrics.map((metric) => (
                      <StaggeredItem key={metric.label}>
                        <div className="p-6 sm:p-8 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-center">
                          <p className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
                            {metric.value}
                          </p>
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                            {metric.label}
                          </p>
                        </div>
                      </StaggeredItem>
                    ))}
                  </StaggeredGrid>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* Testimonial - hidden for GlobFam */}
          {project.testimonial && project.slug !== "globfam" && (
            <Section spacing="md">
              <Container size="md">
                <AnimatedSection variant="scaleIn">
                  <div className="p-8 sm:p-12 rounded-2xl bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))]">
                    <svg className="w-10 h-10 mb-6 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed mb-8">
                      {project.testimonial.quote}
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--color-background))]/20 flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {project.testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{project.testimonial.author}</p>
                        <p className="text-sm opacity-70">
                          {project.testimonial.role}, {project.testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* Awards */}
          {project.awards && project.awards.length > 0 && (
            <Section spacing="sm">
              <Container>
                <AnimatedSection>
                  <div className="flex flex-wrap justify-center gap-4">
                    {project.awards.map((award) => (
                      <div
                        key={award}
                        className="px-4 py-2 rounded-full border border-[hsl(var(--color-border))] text-sm font-medium text-[hsl(var(--color-foreground-muted))]"
                      >
                        {award}
                      </div>
                    ))}
                  </div>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* Live Site CTA */}
          {project.liveUrl && (
            <Section spacing="md">
              <Container>
                <AnimatedSection>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <span className="btn-text-wrapper">
                          <span className="btn-text-primary">
                            {liveLabel}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </span>
                          <span className="btn-text-secondary" aria-hidden="true">
                            {project.liveLabel ?? "View project"}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </span>
                        </span>
                      </a>
                    </Button>
                  </div>
                </AnimatedSection>
              </Container>
            </Section>
          )}

          {/* Next Project */}
          <Section spacing="lg">
            <Container>
              <Separator className="mb-16" />
              <AnimatedSection>
                <Link href={`/work/${nextProject.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl">
                    {/* Background Image */}
                    <div className="aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] relative">
                      {PROJECTS_WITH_REAL_IMAGES.includes(nextProject.slug) ? (
                        <Image
                          src={nextProject.heroImage}
                          alt={`${nextProject.title} preview`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 1200px"
                          placeholder={placeholders[nextProject.heroImage] ? "blur" : "empty"}
                          blurDataURL={placeholders[nextProject.heroImage]}
                        />
                      ) : (
                        <ProjectImagePlaceholder
                          projectName={nextProject.title}
                          imageType="hero"
                          caption=""
                          accentColor={nextProject.accentColor}
                        />
                      )}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 transition-opacity group-hover:from-black/80" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 lg:p-12">
                      <p className="text-[10px] sm:text-xs uppercase font-mono tracking-[0.06em] text-white/60 mb-2 sm:mb-3">
                        Next Case Study
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-[10px] sm:text-xs">
                              {nextProject.category}
                            </Badge>
                          </div>
                          <p className="text-xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-1.5 sm:mb-2 relative inline-block" style={{ color: '#ffffff' }}>
                            {nextProject.title}
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                          </p>
                          <p className="text-xs sm:text-base text-white/70 max-w-xl line-clamp-2">
                            {nextProject.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-white shrink-0 mt-2 sm:mt-0">
                          <span className="text-xs sm:text-sm font-medium">View project</span>
                          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:bg-white/20">
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            </Container>
          </Section>
        </main>
      </PageTransition>
      <Footer />
    </BlurContext.Provider>
  );
}
