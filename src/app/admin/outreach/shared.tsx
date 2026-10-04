"use client";

import { StatusBadge } from "@/components/admin/ui";
import { STATUS_LABEL, type Priority, type ProspectStatus } from "@/lib/outreach/types";

// Shared by the outreach queue and prospect pages.

/** JSON in, JSON out; a refusal becomes an Error with the server's reason. */
export async function api<T>(url: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<T> {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export const TABS: { id: string; label: string; statuses: ProspectStatus[] }[] = [
  { id: "approve", label: "To approve", statuses: ["drafted"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
  { id: "sent", label: "Sent", statuses: ["sent"] },
  { id: "replies", label: "Replies", statuses: ["replied", "meeting"] },
  { id: "closed", label: "Closed", statuses: ["won", "lost", "not-a-fit"] },
  { id: "researched", label: "Researched", statuses: ["researched"] },
];

export const tabFor = (id: string | null) => TABS.find((tab) => tab.id === id) ?? TABS[0];

export const byPriority = (a: { priority: Priority; company: string }, b: { priority: Priority; company: string }) =>
  a.priority.localeCompare(b.priority) || a.company.localeCompare(b.company);

const VARIANT: Record<ProspectStatus, "neutral" | "success" | "warning" | "info" | "accent"> = {
  researched: "neutral",
  drafted: "warning",
  approved: "accent",
  sent: "info",
  replied: "success",
  meeting: "success",
  won: "success",
  lost: "neutral",
  "not-a-fit": "neutral",
};

export function StatusPill({ status }: { status: ProspectStatus }) {
  return <StatusBadge variant={VARIANT[status]}>{STATUS_LABEL[status]}</StatusBadge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const tone =
    priority === "A"
      ? "bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))]"
      : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]";
  return (
    <span title={`Priority ${priority}`} className={`inline-grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold ${tone}`}>
      {priority}
    </span>
  );
}

const SYDNEY = "Australia/Sydney";

/** "4 Oct, 4:41 pm" in Sydney. */
export const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: SYDNEY, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** "Thu 1 Oct" for a YYYY-MM-DD day. */
export const formatDay = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${day}T00:00:00Z`));

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
