import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/assistant/rich-text";
import { Empty } from "@/components/portal/blocks";
import { OutcomeLinks, deliveryFacts } from "@/components/portal/outcome";
import { PageTitle } from "@/components/portal/page-title";
import { longHours, minutesByRequest } from "@/lib/portal/hours";
import { linksOf } from "@/lib/portal/outcome";
import { requireMember } from "@/lib/portal/session";
import type { ClientRequest, ClientTimeEntry } from "@/lib/portal/types";

export const metadata: Metadata = { title: "Past work" };

const SYDNEY = "Australia/Sydney";
const deliveredOn = (request: ClientRequest) => request.delivered_at ?? request.updated_at;
const monthKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: SYDNEY, year: "numeric", month: "2-digit" }).format(new Date(iso));
const monthName = (iso: string, month: "long" | "short" = "long") => new Date(iso).toLocaleDateString("en-AU", { month, year: "numeric", timeZone: SYDNEY });

/**
 * Everything Craefto has delivered for the client, newest first and grouped
 * by month: what it was, what it changed (the outcome Craefto wrote), links to
 * the work, and the time it took against its estimate.
 */
export default async function PastWorkPage() {
  const { account, db } = await requireMember();
  const [{ data }, { data: entryRows }] = await Promise.all([
    db.from("client_requests").select("*").eq("account_id", account.id).eq("status", "delivered"),
    db.from("client_time_entries").select("*").eq("account_id", account.id),
  ]);
  const delivered = ((data ?? []) as ClientRequest[]).sort((a, b) => deliveredOn(b).localeCompare(deliveredOn(a)));
  const logged = minutesByRequest((entryRows ?? []) as ClientTimeEntry[]);

  const months: Array<{ key: string; name: string; items: ClientRequest[]; minutes: number }> = [];
  for (const request of delivered) {
    const key = monthKey(deliveredOn(request));
    let month = months.at(-1);
    if (month?.key !== key) months.push((month = { key, name: monthName(deliveredOn(request)), items: [], minutes: 0 }));
    month.items.push(request);
    month.minutes += logged.get(request.id) ?? 0;
  }
  const totalMinutes = months.reduce((total, month) => total + month.minutes, 0);
  const since = delivered.length ? monthName(deliveredOn(delivered.at(-1)!), "short") : null;

  return (
    <>
      <PageTitle title="Past work">
        <p>Everything we&apos;ve delivered for you: what it was, what it changed, and the time it took.</p>
      </PageTitle>

      {delivered.length === 0 ? (
        <Empty title="Nothing delivered yet">
          Finished requests show here with what we delivered, links to the work, and the time it took against its estimate.
        </Empty>
      ) : (
        <div className="flex flex-col gap-16">
          <dl className="grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="label-heading">Delivered</dt>
              <dd className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums">{delivered.length}</dd>
            </div>
            {totalMinutes > 0 && (
              <div className="flex flex-col gap-1">
                <dt className="label-heading">Time on it</dt>
                <dd className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{longHours(totalMinutes / 60)}</dd>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <dt className="label-heading">Since</dt>
              <dd className="text-2xl sm:text-3xl font-semibold tracking-tight">{since}</dd>
            </div>
          </dl>

          {months.map((month) => (
            <section key={month.key} aria-labelledby={`month-${month.key}`} className="flex flex-col gap-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 id={`month-${month.key}`} className="label-heading">
                  {month.name}
                </h2>
                <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">
                  {month.items.length} delivered{month.minutes > 0 ? ` · ${longHours(month.minutes / 60)}` : ""}
                </span>
              </div>
              <ol className="flex flex-col gap-4">
                {month.items.map((request) => (
                  <li key={request.id}>
                    <article className="flex flex-col gap-4 rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-8">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold tracking-tight">
                          <Link href={`/portal/requests/${request.id}`} className="transition-colors hover:text-[hsl(var(--color-accent))]">
                            {request.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">{deliveryFacts(request, logged.get(request.id) ?? 0).join(" · ")}</p>
                      </div>
                      {request.outcome && (
                        <div className="max-w-2xl leading-relaxed text-[hsl(var(--color-foreground))]">
                          <RichText text={request.outcome} />
                        </div>
                      )}
                      <OutcomeLinks links={linksOf(request)} />
                    </article>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
