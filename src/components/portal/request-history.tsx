import { shortHours } from "@/lib/portal/hours";
import type { ClientRequestEvent, ClientTimeEntry } from "@/lib/portal/types";
import { sydneyDate } from "./thread";

const hours = (value?: number) => (value == null ? "" : Number.isInteger(value) ? String(value) : value.toFixed(1));

/** One line for a move in a request's history. */
function eventText(event: ClientRequestEvent) {
  const { low, high, position } = event.detail;
  const range = low != null && high != null ? (low === high ? `${hours(low)} h` : `${hours(low)}–${hours(high)} h`) : null;
  switch (event.kind) {
    case "sent":
      return "You sent the request";
    case "estimated":
      return range ? `Ask Craefto gave an initial estimate of ${range}` : "Ask Craefto read the request and passed it to Obi to estimate";
    case "confirmed":
      return range ? `Obi confirmed the estimate: ${range}` : "Obi confirmed the estimate";
    case "approved":
      return `You approved the estimate${position ? `; it's #${position} in your queue` : ""}`;
    case "started":
      return "Work started";
    case "needs_info":
      return "We asked for your input";
    case "delivered":
      return "Delivered";
    case "withdrawn":
      return "Withdrawn";
    case "reopened":
      return "Reopened";
  }
}

/**
 * A request's story, oldest first: each move it made, and the time logged
 * day by day, so the work that went in is as visible as the result.
 */
export function RequestHistory({ events, entries }: { events: ClientRequestEvent[]; entries: ClientTimeEntry[] }) {
  type Row = { at: string; text: string; detail?: string; kind: "event" | "time" };
  const rows: Row[] = [
    ...events.map((event) => ({ at: event.created_at, text: eventText(event), kind: "event" as const })),
    ...entries.map((entry) => ({
      // Logged work sits on the evening of the day it was done.
      at: `${entry.worked_on}T18:00:00+10:00`,
      text: `${shortHours(entry.minutes / 60)} of work`,
      detail: entry.note || undefined,
      kind: "time" as const,
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  if (rows.length === 0) return null;
  const total = entries.reduce((sum, entry) => sum + entry.minutes, 0) / 60;
  return (
    <div className="flex flex-col gap-4">
      {total > 0 && (
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
          <span className="font-medium tabular-nums text-[hsl(var(--color-foreground))]">{shortHours(total)}</span> logged so far
        </p>
      )}
      <ol className="relative flex flex-col gap-5 pl-6">
        <span aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-0.5 rounded-full bg-[hsl(var(--color-background-muted))]" />
        {rows.map((row, index) => (
          <li key={index} className="relative">
            <span
              aria-hidden="true"
              className={
                row.kind === "time"
                  ? "absolute -left-6 top-1.5 size-3 rounded-full bg-[hsl(var(--color-accent))] ring-4 ring-[hsl(var(--color-background))]"
                  : "absolute -left-6 top-1.5 size-3 rounded-full bg-[hsl(var(--color-foreground))] ring-4 ring-[hsl(var(--color-background))]"
              }
            />
            <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">{row.text}</p>
            {row.detail && <p className="mt-0.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">{row.detail}</p>}
            <p className="mt-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
              {row.kind === "time" ? sydneyDate(row.at) : sydneyDate(row.at, true)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
