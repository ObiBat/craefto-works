import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer, Container } from "@/components/layout";
import { AnimatedSection, SectionLabel } from "@/components/ui";
import { RevealText } from "@/components/editorial/reveal-text";
import { capabilities } from "@/content/capabilities";
import { planTerms } from "@/content/plan-terms";
import { formatPrice, monthlyPlans } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { chargesGst } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import { BookCall } from "@/components/book-call";
import { PlanCheckout } from "./plan-checkout";

// A plan's start page, from its card on /services: review the scope, agree to
// the plan terms and pay through Stripe Checkout, which returns to the client
// portal. Or book a call first. Kept out of search (noindex, robots.txt).

export const dynamicParams = false;
export const generateStaticParams = () => monthlyPlans.map((plan) => ({ plan: plan.id }));

const planFor = (id: string) => monthlyPlans.find((entry) => entry.id === id);

export async function generateMetadata({ params }: { params: Promise<{ plan: string }> }): Promise<Metadata> {
  const plan = planFor((await params).plan);
  return pageMetadata({
    title: plan ? `Start your ${plan.name} plan` : "Start your plan",
    description: plan
      ? `Review what the ${plan.name} plan includes and its terms, then start it securely through Stripe, or book a call first.`
      : "Start a Craefto Works monthly plan.",
    path: `/subscribe/${plan?.id ?? ""}`,
    noIndex: true,
  });
}

const muted = "text-[hsl(var(--color-foreground-muted))]";
const link = "font-medium text-[hsl(var(--color-accent))] underline-offset-4 hover:underline";

const steps = [
  {
    title: "Pay securely with Stripe",
    text: "Stripe processes the payment, so your card details never reach us. Your invoices are kept under Billing in your portal.",
  },
  {
    title: "Go straight to your client portal",
    text: "It’s where your plan lives: requests, messages, files, calls and billing. To come back later, sign in with your email; there’s no password.",
  },
  {
    title: "Make your first request",
    text: "Tell us what you need first and attach any files. We’ll email you whenever there’s an update.",
  },
  {
    title: "Plan the work together",
    text: "Book your first planning call from the portal. We agree priorities and estimate the work before anything starts.",
  },
];

function Check() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-accent))] text-white" aria-hidden="true">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default async function SubscribePage({ params }: { params: Promise<{ plan: string }> }) {
  const plan = planFor((await params).plan);
  if (!plan) notFound();
  const gst = chargesGst();

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[hsl(var(--color-background))] pt-32 pb-24 md:pt-40 md:pb-32">
        <Container size="xl">
          <div className="flex max-w-3xl flex-col gap-6">
            <Link
              href="/services#plans"
              className="inline-flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))] transition-colors hover:text-[hsl(var(--color-foreground))]"
            >
              <span aria-hidden="true">&larr;</span> All plans
            </Link>
            <h1 className="font-semibold tracking-tight">
              <RevealText text={`Start your ${plan.name} plan`} mode="load" />
            </h1>
            <p className={cn("max-w-2xl text-lg leading-relaxed", muted)}>
              Review what&apos;s included and agree to the plan terms, then pay securely through Stripe. You&apos;ll go straight to your
              client portal, ready to make your first request.
            </p>
            <p className={cn("text-sm", muted)}>
              Rather talk it through first?{" "}
              <a href="#talk" className={link}>
                Book a call or send us a message
              </a>
            </p>
          </div>

          {/* Switch plans without going back. */}
          <nav aria-label="Monthly plans" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              {monthlyPlans.map((entry) => {
                const current = entry.id === plan.id;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/subscribe/${entry.id}`}
                      aria-current={current ? "page" : undefined}
                      // A set 44px (links' minimum touch target), with the text centred in it.
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors",
                        current
                          ? "bg-[hsl(var(--color-accent))] text-white"
                          : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))] hover:bg-[hsl(var(--color-accent-subtle))] hover:text-[hsl(var(--color-accent))]",
                      )}
                    >
                      <span className="font-medium">{entry.name}</span>
                      <span className="tabular-nums opacity-70">{formatPrice(entry.price)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-16 grid gap-16 md:mt-20 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-24">
            <div className="flex flex-col gap-20 md:gap-24">
              <AnimatedSection>
                <section aria-labelledby="scope-heading">
                  <SectionLabel number="01" label="The scope" />
                  <h2 id="scope-heading">What&apos;s included</h2>
                  <p className={cn("mt-4 max-w-2xl leading-relaxed", muted)}>{plan.bestFor}</p>
                  <ul className="mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                    {plan.includes.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                        <Check />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <h3 className="mt-14">All five capabilities</h3>
                  <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed", muted)}>
                    Use your studio time on any of them, and shift between them as your priorities change.
                  </p>
                  <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {capabilities.map((capability) => (
                      <li key={capability.id} className="flex gap-3">
                        <span className="pt-1 font-mono text-xs text-[hsl(var(--color-accent))] tabular-nums">{capability.number}</span>
                        <span>
                          <span className="block font-medium">{capability.name}</span>
                          <span className={cn("block text-sm leading-relaxed", muted)}>{capability.summary}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="mt-14">Budgeted separately</h3>
                  <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed", muted)}>
                    Advertising, software, AI usage, hosting and production costs, including shoot preparation, travel and editing. We
                    agree them with you before they&apos;re incurred.
                  </p>
                </section>
              </AnimatedSection>

              <AnimatedSection>
                <section id="plan-terms" aria-labelledby="terms-heading" className="scroll-mt-28">
                  <SectionLabel number="02" label="The terms" />
                  <h2 id="terms-heading">The plan terms</h2>
                  <p className={cn("mt-4 max-w-2xl leading-relaxed", muted)}>
                    In plain language. They sit alongside our{" "}
                    <Link href="/terms#monthly-plans" className={link}>
                      Terms of Service
                    </Link>
                    , and you agree to both before paying.
                  </p>
                  <dl className="mt-10 flex flex-col gap-7">
                    {planTerms(gst).map((term) => (
                      <div key={term.title} className="grid gap-1.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8">
                        <dt className="font-medium">{term.title}</dt>
                        <dd className={cn("text-[0.9375rem] leading-relaxed", muted)}>{term.text}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </AnimatedSection>

              <AnimatedSection>
                <section aria-labelledby="next-heading">
                  <SectionLabel number="03" label="After you pay" />
                  <h2 id="next-heading">What happens next</h2>
                  <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                    {steps.map((step, index) => (
                      <li key={step.title} className="flex flex-col gap-2">
                        <span className="font-mono text-xs text-[hsl(var(--color-accent))] tabular-nums" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-medium">{step.title}</span>
                        <span className={cn("text-[0.9375rem] leading-relaxed", muted)}>{step.text}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </AnimatedSection>
            </div>

            {/* Sticks beside the scope and terms where the screen is tall enough
                to show all of it, and stays out of the scroll-linked copy motion:
                what you're paying is always legible. */}
            <aside
              aria-label={`Start your ${plan.name} plan`}
              data-no-reveal
              className="flex flex-col gap-4 lg:[@media(min-height:50rem)]:sticky lg:[@media(min-height:50rem)]:top-28"
            >
              <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-2">
                <div className="rounded-[1.25rem] bg-[hsl(var(--color-accent-subtle))] px-6 pt-6 pb-7">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
                    Monthly plan
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-[hsl(var(--color-accent))]">
                    {plan.name}
                  </p>
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatPrice(plan.price)}</span>
                    <span className={cn("text-sm", muted)}>/ month</span>
                  </p>
                  <p className={cn("mt-2 text-sm leading-relaxed", muted)}>
                    {plan.hours} hours of studio time a month, billed in advance in AUD{gst ? " plus GST" : ""}. Cancel any time; it takes
                    effect at your next renewal.
                  </p>
                </div>
                <div className="px-5 pt-6 pb-5 sm:px-6">
                  <PlanCheckout plan={plan.id} />
                </div>
              </div>

              <div id="talk" className="flex scroll-mt-28 flex-col gap-4 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6">
                <div>
                  <h2>
                    <span className="block text-lg font-semibold tracking-tight">Prefer to talk it through first?</span>
                  </h2>
                  <p className={cn("mt-1.5 text-sm leading-relaxed", muted)}>
                    Book a free 30-minute call. We&apos;ll go through the {plan.name} plan and your project, and you can start whenever
                    you&apos;re ready.
                  </p>
                </div>
                <BookCall
                  project={`I'd like to talk about the ${plan.name} plan (${formatPrice(plan.price)} a month).`}
                  bookedNote="Start your plan whenever you're ready."
                  className="w-full"
                />
                <Link
                  href={`/contact?plan=${plan.id}`}
                  className={cn("text-center text-sm transition-colors hover:text-[hsl(var(--color-foreground))]", muted)}
                >
                  Or send us a message
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
