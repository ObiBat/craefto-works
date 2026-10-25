import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoStatic } from "@/components/ui/logo";
import { PortalNav } from "@/components/portal/portal-nav";
import { currentMember } from "@/lib/portal/session";
import { CRAEFTO_INBOX } from "@/lib/portal/notify";

export const metadata: Metadata = {
  title: { default: "Client portal", template: "%s | Craefto portal" },
  robots: { index: false, follow: false },
};

/**
 * The client portal: a quiet header with the client's sections, and none of
 * the site's scroll reveals (data-no-reveal), since this is a place to get
 * things done.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const member = await currentMember();
  // Billing for clients who pay through Stripe, have a monthly fee agreed, or have been sent an invoice.
  let billing = Boolean(member && (member.account.stripe_customer_id || member.subscriptions.length || member.account.monthly_fee != null));
  if (member && !billing) {
    const { count } = await member.db.from("client_invoices").select("id", { count: "exact", head: true }).eq("account_id", member.account.id).neq("status", "draft");
    billing = Boolean(count);
  }
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--color-background))]">
      <header className="sticky top-0 z-40 bg-[hsl(var(--color-background)/0.92)] backdrop-blur-md">
        {member?.preview && (
          <div className="bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))]">
            <Container size="lg">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5 text-sm">
                <p>
                  Viewing as <strong className="font-semibold">{member.account.name || member.account.email}</strong>
                  {member.account.company ? ` · ${member.account.company}` : ""}. Read only: nothing here is sent or changed.
                </p>
                <a href="/portal/preview/exit" className="font-semibold underline underline-offset-4">
                  Exit view
                </a>
              </div>
            </Container>
          </div>
        )}
        <Container size="lg">
          <div className="flex h-16 items-center justify-between gap-6">
            <Link href={member ? "/portal" : "/"} className="flex items-center gap-3" aria-label="Craefto client portal">
              <LogoStatic size="sm" />
              <span className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight text-[hsl(var(--color-foreground))]">
                Craefto
              </span>
              <span className="hidden rounded-full bg-[hsl(var(--color-accent-subtle))] px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[hsl(var(--color-accent))] sm:inline">
                Client portal
              </span>
            </Link>
            {member ? (
              <div className="flex items-center gap-4">
                <span className="hidden max-w-[14rem] truncate text-sm text-[hsl(var(--color-foreground-subtle))] md:inline">
                  {member.account.email}
                </span>
                {!member.preview && (
                  <form action="/portal/signout" method="post">
                    <button
                      type="submit"
                      className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-foreground))]"
                    >
                      Sign out
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-foreground))]"
              >
                craefto.com
              </Link>
            )}
          </div>
          {member && (
            <div className="pb-3">
              <PortalNav billing={billing} />
            </div>
          )}
        </Container>
      </header>

      <main id="main-content" data-no-reveal className="flex-1 py-10 md:py-16">
        <Container size="lg">{children}</Container>
      </main>

      <footer className="py-10">
        <Container size="lg">
          <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">
            Questions about your plan or an invoice?{" "}
            <a href={`mailto:${CRAEFTO_INBOX}`} className="font-medium text-[hsl(var(--color-accent))] hover:underline">
              {CRAEFTO_INBOX}
            </a>
          </p>
        </Container>
      </footer>
    </div>
  );
}
