import type { Metadata } from "next";
import Link from "next/link";
import { BackLink, Callout } from "@/components/portal/blocks";
import { NewRequestForm } from "@/components/portal/forms";
import { PageTitle } from "@/components/portal/page-title";
import { sydneyToday } from "@/lib/portal/hours";
import { requireMember } from "@/lib/portal/session";

export const metadata: Metadata = { title: "New request" };

export default async function NewRequestPage() {
  const { allowance, account } = await requireMember();
  return (
    <div className="max-w-2xl">
      <BackLink href="/portal/requests">All requests</BackLink>
      <PageTitle title="New request">
        <p>One request for each piece of work keeps everything easy to follow. You can add more later in its messages.</p>
      </PageTitle>
      {allowance ? (
        <>
          <ol className="mb-12 grid gap-4 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 sm:grid-cols-3 md:p-8">
            {[
              ["Within a minute", "Ask Craefto replies with an initial estimate in hours, and what it covers."],
              ["Then", "Craefto Works checks the estimate and confirms it. Nothing starts until you approve it."],
              ["Once approved", "It joins your queue, and you see the time we log on it as the work goes."],
            ].map(([when, what], index) => (
              <li key={when} className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">
                  {index + 1} · {when}
                </span>
                <span className="text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">{what}</span>
              </li>
            ))}
          </ol>
          <NewRequestForm email={account.email} today={sydneyToday()} />
        </>
      ) : (
        <Callout title="Requests are paused">
          New requests open when your plan is active. See{" "}
          <Link href="/portal/billing" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
            Billing
          </Link>
          , or message us if that&apos;s unexpected.
        </Callout>
      )}
    </div>
  );
}
