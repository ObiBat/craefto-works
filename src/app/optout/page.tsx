import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Header, Footer, Container, Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/editorial/reveal-text";
import { readToken } from "@/lib/outreach/optout";

export const metadata: Metadata = pageMetadata({
  title: "Stop emails from Craefto Works",
  description: "Opt out of emails from Craefto Works.",
  path: "/optout",
  noIndex: true,
});

export const dynamic = "force-dynamic";

interface OptOutPageProps {
  searchParams: Promise<{ t?: string; done?: string }>;
}

const MAILBOX = "obi@craefto.com";

function validToken(token: string | undefined) {
  try {
    return readToken(token) !== null;
  } catch {
    return false;
  }
}

/**
 * Where an outreach email's unsubscribe link lands. Visiting only asks;
 * the button (or a mail app's one-click unsubscribe) does it, through
 * /api/optout, so link scanners can't opt anyone out by following the link.
 */
export default async function OptOutPage({ searchParams }: OptOutPageProps) {
  const { t, done } = await searchParams;
  const state = done === "done" ? "done" : done === "test" ? "test" : done || !validToken(t) ? "invalid" : "ask";

  const copy = {
    ask: {
      heading: "Stop emails from Craefto Works",
      body: "Press the button and we won't email you again. It takes effect straight away.",
    },
    done: {
      heading: "You won't hear from us again",
      body: "Your address is on our do-not-email list, and it stays there. Sorry for the interruption.",
    },
    test: {
      heading: "This was a test email",
      body: "Nothing has changed: the link only works in emails actually sent to you.",
    },
    invalid: {
      heading: "This link didn't work",
      body: `You can still opt out: reply "no thanks" to the email, or write to ${MAILBOX}, and we won't email you again.`,
    },
  }[state];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[hsl(var(--color-background))] pt-32 pb-20">
        <Section>
          <Container>
            <div className="max-w-lg mx-auto text-center">
              <h1 className="text-2xl font-semibold text-[hsl(var(--color-foreground))] mb-4">
                <RevealText text={copy.heading} mode="load" />
              </h1>
              <p className="text-[hsl(var(--color-foreground-muted))] mb-8">{copy.body}</p>
              {state === "ask" ? (
                <form method="post" action="/api/optout">
                  <input type="hidden" name="t" value={t} />
                  <Button type="submit">Stop emails</Button>
                </form>
              ) : (
                <Link href="/" className="text-sm text-[hsl(var(--color-foreground-muted))] underline-offset-4 hover:underline">
                  Go to craefto.com
                </Link>
              )}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
