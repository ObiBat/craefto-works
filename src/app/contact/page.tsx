"use client";

import * as React from "react";
import { Suspense } from "react";
import { Header, Footer, Container, Section } from "@/components/layout";
import { PageTransition, AnimatedSection, HeroText } from "@/components/ui";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/lib/constants";

function ContactFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="h-12 bg-[hsl(var(--color-background-muted))] rounded-lg" />
        <div className="h-12 bg-[hsl(var(--color-background-muted))] rounded-lg" />
      </div>
      <div className="h-12 bg-[hsl(var(--color-background-muted))] rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="h-12 bg-[hsl(var(--color-background-muted))] rounded-lg" />
        <div className="h-12 bg-[hsl(var(--color-background-muted))] rounded-lg" />
        <div className="h-12 bg-[hsl(var(--color-background-muted))] rounded-lg" />
      </div>
      <div className="h-32 bg-[hsl(var(--color-background-muted))] rounded-lg" />
      <div className="h-12 w-40 bg-[hsl(var(--color-background-muted))] rounded-lg" />
    </div>
  );
}

export default function ContactPage() {
  const [copied, setCopied] = React.useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          <Section spacing="sm" className="pb-8 md:pb-6">
            <Container>
              {/* Breadcrumb */}
              <nav className="mb-4" aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                  <li>
                    <a href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <span className="mx-2">/</span>
                  </li>
                  <li className="text-[hsl(var(--color-foreground))] font-medium">Contact</li>
                </ol>
              </nav>

              {/* Header */}
              <div className="mb-8 md:mb-10">
                <HeroText>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Start a project
                  </h1>
                </HeroText>
                <HeroText delay={0.1}>
                  <p className="text-base text-[hsl(var(--color-foreground-muted))] mt-2 max-w-md">
                    For founders and teams who value clarity and craft.
                  </p>
                </HeroText>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Form - Takes most space */}
                <div className="lg:col-span-8">
                  <AnimatedSection delay={0.15}>
                    <Suspense fallback={<ContactFormSkeleton />}>
                      <ContactForm />
                    </Suspense>
                  </AnimatedSection>
                </div>

                {/* Sidebar - Compact */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Email Card */}
                  <AnimatedSection delay={0.25}>
                    <div className="p-5 rounded-xl bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))]">
                      <p className="text-xs uppercase font-mono tracking-[0.06em] opacity-50 mb-2">
                        Prefer email?
                      </p>
                      <button
                        onClick={copyEmail}
                        className="group flex items-center justify-between w-full"
                        aria-label="Copy email address"
                      >
                        <span className="text-sm font-medium group-hover:opacity-80 transition-opacity">
                          {siteConfig.email}
                        </span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-white/10 group-hover:bg-white/20"}`}>
                          {copied ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </AnimatedSection>

                  {/* What to expect */}
                  <AnimatedSection delay={0.3}>
                    <div className="space-y-4">
                      <p className="text-xs uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                        What happens next
                      </p>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--color-background-muted))] flex items-center justify-center text-xs font-medium text-[hsl(var(--color-foreground-muted))]">1</div>
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">We review your project details</p>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--color-background-muted))] flex items-center justify-center text-xs font-medium text-[hsl(var(--color-foreground-muted))]">2</div>
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">Schedule a discovery call</p>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--color-background-muted))] flex items-center justify-center text-xs font-medium text-[hsl(var(--color-foreground-muted))]">3</div>
                          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">Receive a personalised proposal</p>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>

                  {/* Status Info */}
                  <AnimatedSection delay={0.35} className="flex flex-wrap items-center gap-3 pt-4 border-t border-[hsl(var(--color-border))]">
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Sydney, AU
                    </div>
                    <span className="text-[hsl(var(--color-foreground-subtle))]">·</span>
                    <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Working globally</span>
                    <span className="text-[hsl(var(--color-foreground-subtle))]">·</span>
                    <span className="text-sm text-[hsl(var(--color-foreground-muted))]">Replies in 1 to 2 days</span>
                  </AnimatedSection>
                </div>
              </div>
            </Container>
          </Section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
