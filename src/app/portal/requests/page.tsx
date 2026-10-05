import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, Section } from "@/components/portal/blocks";
import { HoursMeter } from "@/components/portal/hours-meter";
import { PageTitle } from "@/components/portal/page-title";
import { RequestList } from "@/components/portal/request-list";
import { RequestStatusPill } from "@/components/portal/status-pill";
import { minutesByRequest, usageFor } from "@/lib/portal/hours";
import { requireMember } from "@/lib/portal/session";
import { REQUEST_STATUSES, isWaitingOnClient, type ClientRequest, type ClientTimeEntry, type RequestStatus } from "@/lib/portal/types";

export const metadata: Metadata = { title: "Requests" };

const byQueue = (a: ClientRequest, b: ClientRequest) => (a.queue_position ?? 999) - (b.queue_position ?? 999);

export default async function RequestsPage() {
  const { account, allowance, db } = await requireMember();
  const [{ data }, { data: entryRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("account_id", account.id).order("updated_at", { ascending: false }),
    db.from("client_time_entries").select("*").eq("account_id", account.id),
  ]);
  const requests = (data ?? []) as ClientRequest[];
  const entries = (entryRows ?? []) as ClientTimeEntry[];
  const logged = minutesByRequest(entries);
  const usage = usageFor(allowance, entries, requests);

  const waiting = requests.filter(isWaitingOnClient);
  const working = requests.filter((request) => request.status === "in_progress").sort(byQueue);
  const queue = requests.filter((request) => request.status === "queued").sort(byQueue);
  const estimating = requests.filter((request) => request.status === "received");
  const delivered = requests.filter((request) => request.status === "delivered");
  const withdrawn = requests.filter((request) => request.status === "withdrawn");

  const newRequest = allowance && (
    <Button asChild size="lg">
      <Link href="/portal/requests/new">New request</Link>
    </Button>
  );

  return (
    <>
      <PageTitle title="Requests" actions={requests.length > 0 && newRequest}>
        <p>Everything you&apos;ve asked for: its estimate before work starts, the time that goes in, and where it sits in your queue.</p>
      </PageTitle>

      {requests.length === 0 ? (
        <Empty title="No requests yet" action={newRequest}>
          {allowance
            ? "Send one whenever you're ready: tell us what you need, and add links, dates and examples you like. Ask Craefto replies with an initial estimate within a minute."
            : "Requests open again when your plan is active."}
        </Empty>
      ) : (
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-14">
            {waiting.length > 0 && (
              <Section title={`Waiting on you · ${waiting.length}`}>
                <RequestList requests={waiting} logged={logged} />
              </Section>
            )}
            {working.length > 0 && (
              <Section title={`In progress · ${working.length}`}>
                <RequestList requests={working} logged={logged} numbered />
              </Section>
            )}
            {queue.length > 0 && (
              <Section title={`Your queue · ${queue.length}`}>
                <p className="-mt-1 text-sm text-[hsl(var(--color-foreground-subtle))]">Approved and waiting their turn, in the order we&apos;ll take them.</p>
                <RequestList requests={queue} logged={logged} numbered />
              </Section>
            )}
            {estimating.length > 0 && (
              <Section title={`Being estimated · ${estimating.length}`}>
                <RequestList requests={estimating} logged={logged} />
              </Section>
            )}
            {delivered.length > 0 && (
              <Section title={`Delivered · ${delivered.length}`}>
                <RequestList requests={delivered} logged={logged} />
              </Section>
            )}
            {withdrawn.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <h2 className="label-heading inline">Withdrawn · {withdrawn.length}</h2>
                </summary>
                <div className="mt-4">
                  <RequestList requests={withdrawn} logged={logged} />
                </div>
              </details>
            )}
          </div>
          <aside className="flex flex-col gap-6 lg:sticky lg:top-36 lg:self-start">
            <HoursMeter usage={usage} />
          </aside>
        </div>
      )}

      <section className="mt-20">
        <h2 className="label-heading mb-6">How requests move</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(REQUEST_STATUSES) as RequestStatus[])
            .filter((status) => status !== "withdrawn")
            .map((status) => (
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
