import type { Metadata } from "next";
import { Section } from "@/components/portal/blocks";
import { CalBooking } from "@/components/portal/cal-booking";
import { PageTitle } from "@/components/portal/page-title";
import { CAL_LINK } from "@/lib/portal/meetings";
import { callTime, cancelUrl, rescheduleUrl } from "@/lib/portal/call-times";
import { planName } from "@/lib/portal/notify";
import { requireMember } from "@/lib/portal/session";
import type { ClientMeeting } from "@/lib/portal/types";

export const metadata: Metadata = { title: "Calls" };

const link = "inline-flex items-center text-sm font-medium text-[hsl(var(--color-accent))] hover:underline";

/** Book a call with Craefto, and see the ones coming up. */
export default async function CallsPage() {
  const { account, plans, db } = await requireMember();
  const { data } = await db
    .from("client_meetings")
    .select("*")
    .eq("account_id", account.id)
    .eq("status", "booked")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");
  const upcoming = (data ?? []) as ClientMeeting[];
  const notes = [
    account.company && `Company: ${account.company}`,
    plans.length > 0 && `Plan: ${plans.map((plan) => planName(plan.plan)).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <PageTitle title="Calls">
        <p>
          Book a time to talk it through: a kickoff, feedback or what&apos;s next. The invite comes to {account.email}, with a link to
          join.
        </p>
      </PageTitle>

      <div className="flex flex-col gap-14">
        {upcoming.length > 0 && (
          <Section title="Coming up">
            <ul className="flex flex-col gap-2">
              {upcoming.map((call) => (
                <li
                  key={call.id}
                  className="flex flex-col gap-3 rounded-2xl bg-[hsl(var(--color-accent-subtle))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{callTime(call)}</span>
                    <span className="mt-0.5 block truncate text-sm text-[hsl(var(--color-foreground-subtle))]">{call.title}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    {call.join_url && (
                      <a href={call.join_url} target="_blank" rel="noopener noreferrer" className={link}>
                        Join
                      </a>
                    )}
                    <a href={rescheduleUrl(call.cal_uid)} target="_blank" rel="noopener noreferrer" className={link}>
                      Reschedule
                    </a>
                    <a href={cancelUrl(call.cal_uid)} target="_blank" rel="noopener noreferrer" className={link}>
                      Cancel
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={upcoming.length > 0 ? "Book another call" : "Book a call"}>
          <CalBooking calLink={CAL_LINK} name={account.name ?? ""} email={account.email} notes={notes} />
        </Section>
      </div>
    </>
  );
}
