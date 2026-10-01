import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, Section } from "@/components/portal/blocks";
import { PageTitle } from "@/components/portal/page-title";
import { RequestList } from "@/components/portal/request-list";
import { RequestStatusPill } from "@/components/portal/status-pill";
import { requireMember } from "@/lib/portal/session";
import { REQUEST_STATUSES, type ClientRequest, type RequestStatus } from "@/lib/portal/types";

export const metadata: Metadata = { title: "Requests" };

export default async function RequestsPage() {
  const { account, plans, db } = await requireMember();
  const { data } = await db
    .from("client_requests")
    .select("*")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false });
  const requests = (data ?? []) as ClientRequest[];
  const open = requests.filter((request) => request.status !== "delivered");
  const delivered = requests.filter((request) => request.status === "delivered");
  const live = plans.length > 0;

  const newRequest = live && (
    <Button asChild size="lg">
      <Link href="/portal/requests/new">New request</Link>
    </Button>
  );

  return (
    <>
      <PageTitle title="Requests" actions={requests.length > 0 && newRequest}>
        <p>Everything you&apos;ve asked for, from the moment it lands to delivery.</p>
      </PageTitle>

      {requests.length === 0 ? (
        <Empty title="No requests yet" action={newRequest}>
          {live
            ? "Send one whenever you're ready: tell us what you need, and add links, dates and examples you like."
            : "Requests open again when your plan is active."}
        </Empty>
      ) : (
        <div className="flex flex-col gap-14">
          <Section title={`Open · ${open.length}`}>
            {open.length > 0 ? (
              <RequestList requests={open} />
            ) : (
              <p className="text-[hsl(var(--color-foreground-subtle))]">Nothing open right now.</p>
            )}
          </Section>
          {delivered.length > 0 && (
            <Section title={`Delivered · ${delivered.length}`}>
              <RequestList requests={delivered} />
            </Section>
          )}
        </div>
      )}

      <section className="mt-20">
        <h2 className="label-heading mb-6">How requests move</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(REQUEST_STATUSES) as RequestStatus[]).map((status) => (
            <li key={status} className="flex flex-col items-start gap-3">
              <RequestStatusPill status={status} />
              <span className="text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">{REQUEST_STATUSES[status].hint}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
