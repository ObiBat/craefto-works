import Link from "next/link";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Section spacing="xl">
          <Container>
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
              <div className="flex flex-col items-center gap-6 max-w-lg">
                <span className="text-8xl font-semibold text-[hsl(var(--color-foreground-subtle))]">
                  404
                </span>

                <h1 className="text-3xl font-semibold tracking-tight"><RevealText text={"Page not found"} mode="load" /></h1>

                <p className="text-lg text-[hsl(var(--color-foreground-muted))]">
                  The page you&apos;re looking for doesn&apos;t exist or has been
                  moved.
                </p>

                <Button asChild className="mt-4">
                  <Link href="/">
                    <span className="btn-text-wrapper">
                      <span className="btn-text-primary">
                        Go home
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                      <span className="btn-text-secondary" aria-hidden="true">
                        Take me back
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
