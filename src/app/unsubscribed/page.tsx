import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Header, Footer, Container, Section } from "@/components/layout";
import { RevealText } from "@/components/editorial/reveal-text";

export const metadata: Metadata = pageMetadata({
  title: "Unsubscribed",
  description:
    "You have been unsubscribed from the Craefto Journal.",
  path: "/unsubscribed",
  noIndex: true,
});

interface UnsubscribedPageProps {
  searchParams: Promise<{ success?: string; already?: string; error?: string }>;
}

export default async function UnsubscribedPage({ searchParams }: UnsubscribedPageProps) {
  const params = await searchParams;
  const success = params.success === "true";
  const already = params.already === "true";
  const error = params.error;

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[hsl(var(--color-background))] pt-32 pb-20">
        <Section>
          <Container>
            <div className="max-w-lg mx-auto text-center">
              {error ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-semibold text-[hsl(var(--color-foreground))] mb-4"><RevealText text={"Something went wrong"} mode="load" /></h1>
                  <p className="text-[hsl(var(--color-foreground-muted))] mb-8">
                    {error === "invalid_token"
                      ? "This unsubscribe link is invalid or has expired."
                      : "We couldn't process your request. Please try again."}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--color-background-muted))] flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[hsl(var(--color-foreground-muted))]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-semibold text-[hsl(var(--color-foreground))] mb-4">
                    <RevealText text={already ? "Already unsubscribed" : "You've been unsubscribed"} mode="load" />
                  </h1>
                  <p className="text-[hsl(var(--color-foreground-muted))] mb-8">
                    {already
                      ? "Your email was already removed from our list."
                      : "We're sorry to see you go. You won't receive any more emails from us."}
                  </p>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/journal"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] font-medium hover:opacity-90 transition-opacity"
                >
                  Visit the Journal
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] font-medium hover:bg-[hsl(var(--color-background-muted))] transition-colors"
                >
                  Go to Homepage
                </Link>
              </div>

              {(success || already) && !error && (
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-8">
                  Changed your mind?{" "}
                  <Link
                    href="/journal"
                    className="text-[hsl(var(--color-accent))] hover:underline"
                  >
                    Subscribe again
                  </Link>
                </p>
              )}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
