import { Suspense } from "react";
import type { Icon } from "@phosphor-icons/react";
import { ChatCircleText, FileText, RocketLaunch, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { Header, Footer, Container, Section } from "@/components/layout";
import { AnimatedSection, HeroText, PageTransition } from "@/components/ui";
import { BookCall } from "@/components/book-call";
import { ContactForm } from "@/components/forms/contact-form";
import { RevealText } from "@/components/editorial/reveal-text";
import { CopyEmail } from "./copy-email";

// One form for anything from a brand or a campaign shoot to a website, a
// product or an automation. The steps match /start and the Discovery Call.

const muted = "text-[hsl(var(--color-foreground-muted))]";

const steps: { icon: Icon; title: string; text: string }[] = [
  { icon: ChatCircleText, title: "Tell us what you have in mind", text: "A sentence is enough. You don't need a polished brief." },
  { icon: VideoCamera, title: "We talk it through", text: "A free 30-minute call on Google Meet, about your business and your goals." },
  { icon: FileText, title: "You get a proposal", text: "A fixed price and a timeline, so you can decide with everything on the table." },
  { icon: RocketLaunch, title: "We get to work", text: "You work directly with the people doing the work, and hear from us throughout." },
];

function ContactFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 rounded-2xl bg-[hsl(var(--color-background-subtle))]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-[hsl(var(--color-background-subtle))]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="h-12 rounded-lg bg-[hsl(var(--color-background-subtle))]" />
        <div className="h-12 rounded-lg bg-[hsl(var(--color-background-subtle))]" />
      </div>
      <div className="h-32 rounded-lg bg-[hsl(var(--color-background-subtle))]" />
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          <Section spacing="sm" className="pb-24 md:pb-40">
            <Container>
              <div className="max-w-4xl">
                <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">Contact</p>
                <h1 className="font-semibold tracking-tight">
                  <RevealText text={"Start a project"} mode="load" />
                </h1>
                <HeroText delay={0.15}>
                  <p className={`mt-8 max-w-2xl text-xl leading-relaxed ${muted}`}>
                    From a brand or a campaign shoot to a website, a product or an automation system: tell us what you need. One team
                    plans it with you, across brand, product, systems, media and growth.
                  </p>
                </HeroText>
              </div>

              <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-8">
                  <AnimatedSection delay={0.15}>
                    <Suspense fallback={<ContactFormSkeleton />}>
                      <ContactForm />
                    </Suspense>
                  </AnimatedSection>
                </div>

                <aside className="flex flex-col gap-4 lg:col-span-4" aria-label="Other ways to reach us">
                  <AnimatedSection delay={0.2}>
                    <div className="rounded-3xl bg-[hsl(var(--color-accent-subtle))] p-7">
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">Prefer to talk first?</p>
                      <p className={`mt-3 leading-relaxed ${muted}`}>Book a free 30-minute call on Google Meet. No pressure and no commitment.</p>
                      <BookCall variant="accent" className="mt-6">
                        Book a free call
                      </BookCall>
                    </div>
                  </AnimatedSection>

                  <AnimatedSection delay={0.25}>
                    <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-7">
                      <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">Prefer email?</p>
                      <CopyEmail />
                    </div>
                  </AnimatedSection>

                  <AnimatedSection delay={0.3}>
                    <div className="px-1 pt-6">
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">What happens next</p>
                      <ol className="mt-5 flex flex-col gap-5">
                        {steps.map((step) => {
                          const StepIcon = step.icon;
                          return (
                            <li key={step.title} className="flex gap-4">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]">
                                <StepIcon size={20} weight="duotone" aria-hidden="true" />
                              </span>
                              <span className="flex flex-col gap-0.5">
                                <span className="font-medium text-[hsl(var(--color-foreground))]">{step.title}</span>
                                <span className={`text-sm leading-relaxed ${muted}`}>{step.text}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      <p className={`mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${muted}`}>
                        <span className="inline-flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--color-accent))] opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--color-accent))]" />
                          </span>
                          Sydney, AU
                        </span>
                        <span className="text-[hsl(var(--color-foreground-subtle))]">·</span>
                        <span>Working globally</span>
                        <span className="text-[hsl(var(--color-foreground-subtle))]">·</span>
                        <span>Replies in one to two days</span>
                      </p>
                    </div>
                  </AnimatedSection>
                </aside>
              </div>
            </Container>
          </Section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
