import type { Metadata } from "next";
import Link from "next/link";
import { BackLink, Callout } from "@/components/portal/blocks";
import { NewRequestForm } from "@/components/portal/forms";
import { PageTitle } from "@/components/portal/page-title";
import { requireMember } from "@/lib/portal/session";

export const metadata: Metadata = { title: "New request" };

export default async function NewRequestPage() {
  const { plans, account } = await requireMember();
  return (
    <div className="max-w-2xl">
      <BackLink href="/portal/requests">All requests</BackLink>
      <PageTitle title="New request">
        <p>One request for each piece of work keeps everything easy to follow. You can add more later in its messages.</p>
      </PageTitle>
      {plans.length > 0 ? (
        <NewRequestForm email={account.email} />
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
