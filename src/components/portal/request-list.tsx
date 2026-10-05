import Link from "next/link";
import { shortHours } from "@/lib/portal/hours";
import type { ClientRequest } from "@/lib/portal/types";
import { RequestStatusPill } from "./status-pill";
import { sydneyDate } from "./thread";

const hours = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });

/** A request's facts in a line: its estimate, the time logged, and the date that matters. */
function facts(request: ClientRequest, minutes: number) {
  const parts: string[] = [];
  if (request.status === "delivered" && request.delivered_at) parts.push(`Delivered ${sydneyDate(request.delivered_at)}`);
  else parts.push(`Updated ${sydneyDate(request.updated_at)}`);
  if (request.estimate_low != null && request.estimate_high != null) {
    const low = Number(request.estimate_low);
    const high = Number(request.estimate_high);
    const range = low === high ? `${hours(low)} h` : `${hours(low)}–${hours(high)} h`;
    parts.push(request.estimate_state === "initial" ? `${range} initial estimate` : `${range} estimate`);
  }
  if (minutes > 0) parts.push(`${shortHours(minutes / 60)} logged`);
  if (request.status !== "delivered" && request.status !== "withdrawn") {
    if (request.target_date && request.estimate_state === "approved") parts.push(`Target ${day(request.target_date)}`);
    else if (request.needed_by) parts.push(`Needed by ${day(request.needed_by)}`);
  }
  return parts.join(" · ");
}

/** Requests as rows: what was asked, its estimate and time, where it stands; numbered in queue order when asked. */
export function RequestList({ requests, logged, numbered = false }: { requests: ClientRequest[]; logged?: Map<string, number>; numbered?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {requests.map((request) => (
        <li key={request.id}>
          <Link
            href={`/portal/requests/${request.id}`}
            className="group flex items-center gap-4 rounded-2xl bg-[hsl(var(--color-background-subtle))] px-5 py-4 transition-colors hover:bg-[hsl(var(--color-accent-subtle))]"
          >
            {numbered && request.queue_position != null && (
              <span
                aria-label={`Number ${request.queue_position} in your queue`}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--color-background))] font-mono text-sm font-medium tabular-nums text-[hsl(var(--color-foreground-muted))]"
              >
                {request.queue_position}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="min-w-0">
                <span className="block truncate font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">{request.title}</span>
                <span className="mt-0.5 block text-sm text-[hsl(var(--color-foreground-subtle))]">{facts(request, logged?.get(request.id) ?? 0)}</span>
              </span>
              <span className="self-start sm:self-auto">
                <RequestStatusPill status={request.status} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
