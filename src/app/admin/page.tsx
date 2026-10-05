"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconMail,
  IconMessageSquare,
  IconPhone,
  IconSend,
  IconTarget,
  IconUserPlus,
  IconUsers,
} from "@/components/admin/icons";
import { Card, PageContainer, PageHeader, Section } from "@/components/admin/ui";
import type { ClientGlance, Need, NeedKind, Today, Upcoming, UpcomingKind } from "@/lib/admin/today";
import { cn } from "@/lib/utils";

const ZONE = "Australia/Sydney";

const NEED_STYLE: Record<NeedKind, { icon: React.ReactNode; tone: string; label: string }> = {
  "client-message": { icon: <IconMessageSquare size={18} />, tone: "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]", label: "Client" },
  estimate: { icon: <IconClock size={18} />, tone: "bg-[hsl(var(--color-warning-subtle))] text-[hsl(35_55%_30%)]", label: "Estimate" },
  overrun: { icon: <IconAlertTriangle size={18} />, tone: "bg-[hsl(var(--color-error-subtle))] text-[hsl(var(--color-error))]", label: "Over estimate" },
  reply: { icon: <IconMail size={18} />, tone: "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]", label: "Outreach reply" },
  enquiry: { icon: <IconTarget size={18} />, tone: "bg-[hsl(var(--color-success-subtle))] text-[hsl(var(--color-success))]", label: "Enquiry" },
  handoff: { icon: <IconUsers size={18} />, tone: "bg-[hsl(var(--color-secondary-subtle))] text-[hsl(var(--color-foreground-muted))]", label: "Ask Craefto" },
  application: { icon: <IconUserPlus size={18} />, tone: "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]", label: "Application" },
  drafts: { icon: <IconSend size={18} />, tone: "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]", label: "Outreach" },
};

const UPCOMING_STYLE: Record<UpcomingKind, { icon: React.ReactNode; label: string }> = {
  "client-call": { icon: <IconPhone size={16} />, label: "Client call" },
  "discovery-call": { icon: <IconPhone size={16} />, label: "Discovery Call" },
  target: { icon: <IconCalendar size={16} />, label: "Delivery date" },
  "needed-by": { icon: <IconCalendar size={16} />, label: "Needed by" },
};

const MODE_LABEL = { off: "Sender off", test: "Test mode", live: "Live" } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-AU", { timeZone: ZONE, hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const longDate = (now: Date) => new Intl.DateTimeFormat("en-AU", { timeZone: ZONE, weekday: "long", day: "numeric", month: "long" }).format(now);

const sydneyDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/** "Just now", "40 min ago", "3 h ago", "Yesterday", "2 Oct" */
function ago(iso: string, now: Date) {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60 && sydneyDay(new Date(iso)) === sydneyDay(now)) return `${Math.round(minutes / 60)} h ago`;
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (sydneyDay(new Date(iso)) === sydneyDay(yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-AU", { timeZone: ZONE, day: "numeric", month: "short" }).format(new Date(iso));
}

function dayHeading(day: string, now: Date) {
  if (day === sydneyDay(now)) return "Today";
  if (day === sydneyDay(new Date(now.getTime() + 86_400_000))) return "Tomorrow";
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
}

const time = (iso: string) => new Intl.DateTimeFormat("en-AU", { timeZone: ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

const hours = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(value < 10 ? 2 : 1).replace(/0$/, ""));

const count = (value: number) => new Intl.NumberFormat("en-AU").format(value);

function change(now: number, before: number) {
  if (before === 0) return now > 0 ? "New this week" : "No visits yet";
  const percent = Math.round(((now - before) / before) * 100);
  if (percent === 0) return "Same as last week";
  return `${percent > 0 ? "+" : ""}${percent}% on last week`;
}

function Figure({ label, value, note, href }: { label: string; value: string; note: string; href: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50 p-4 transition-all duration-200 hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 sm:p-5"
    >
      <p className="text-xs text-[hsl(var(--color-foreground-muted))]">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums text-[hsl(var(--color-foreground))] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[hsl(var(--color-foreground-subtle))] transition-colors group-hover:text-[hsl(var(--color-foreground-muted))]">{note}</p>
    </Link>
  );
}

function NeedRow({ need, now }: { need: Need; now: Date }) {
  const style = NEED_STYLE[need.kind];
  return (
    <li>
      <Link href={need.href} className="group flex items-start gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-[hsl(var(--color-background-muted))]/40 md:px-4">
        <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", style.tone)} aria-hidden="true">
          {style.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <span className="font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">{need.title}</span>
            <span className="order-last text-xs text-[hsl(var(--color-foreground-subtle))] sm:order-none sm:shrink-0">
              {style.label}
              {need.at && ` · ${ago(need.at, now)}`}
            </span>
          </span>
          {need.detail && <span className="mt-0.5 block text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">{need.detail}</span>}
        </span>
        <IconChevronRight size={16} className="mt-2.5 shrink-0 text-[hsl(var(--color-foreground-subtle))] transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

function UpcomingList({ items, now }: { items: Upcoming[]; now: Date }) {
  const days = new Map<string, Upcoming[]>();
  for (const item of items) {
    const day = item.allDay ? item.at : sydneyDay(new Date(item.at));
    days.set(day, [...(days.get(day) ?? []), item]);
  }
  return (
    <ol className="space-y-5">
      {[...days].map(([day, list]) => (
        <li key={day}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[hsl(var(--color-foreground-subtle))]">{dayHeading(day, now)}</p>
          <ul className="space-y-1">
            {list.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[hsl(var(--color-background-muted))]/40">
                  <span className="mt-0.5 text-[hsl(var(--color-foreground-subtle))]" aria-hidden="true">
                    {UPCOMING_STYLE[item.kind].icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">
                      {!item.allDay && <span className="tabular-nums">{time(item.at)} · </span>}
                      {item.title}
                    </span>
                    <span className="block text-xs text-[hsl(var(--color-foreground-muted))]">
                      {UPCOMING_STYLE[item.kind].label} · {item.detail}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function ClientCard({ client }: { client: ClientGlance }) {
  const allowance = client.allowance;
  const usedShare = allowance ? Math.min(100, (client.used / allowance) * 100) : 0;
  const committedShare = allowance ? Math.min(100 - usedShare, (client.committed / allowance) * 100) : 0;
  const over = allowance != null && client.used > allowance;
  return (
    <Link
      href={client.href}
      className="group block rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50 p-5 transition-all duration-200 hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">{client.name}</p>
          <p className="truncate text-xs text-[hsl(var(--color-foreground-subtle))]">{client.allowanceLabel ?? "Plan"}</p>
        </div>
        <IconChevronRight size={16} className="mt-1 shrink-0 text-[hsl(var(--color-foreground-subtle))] transition-transform group-hover:translate-x-0.5" />
      </div>
      {allowance != null ? (
        <>
          <p className="mt-4 text-sm">
            <span className={cn("font-mono font-semibold tabular-nums", over && "text-[hsl(var(--color-error))]")}>{hours(client.used)} h</span>
            <span className="text-[hsl(var(--color-foreground-muted))]"> used of {hours(allowance)} h</span>
          </p>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[hsl(var(--color-background-muted))]" aria-hidden="true">
            <div className={cn("h-full", over ? "bg-[hsl(var(--color-error))]" : "bg-[hsl(var(--color-accent))]")} style={{ width: `${usedShare}%` }} />
            <div className="h-full bg-[hsl(var(--color-accent))]/30" style={{ width: `${committedShare}%` }} />
          </div>
          <p className="mt-2 text-xs text-[hsl(var(--color-foreground-subtle))]">
            {client.committed > 0 ? `Up to ${hours(client.committed)} h approved still to do` : "Nothing approved waiting"}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-[hsl(var(--color-foreground-muted))]">No monthly hours set</p>
      )}
      <p className="mt-3 text-xs text-[hsl(var(--color-foreground-muted))]">
        {client.open} open request{client.open === 1 ? "" : "s"}
        {client.waitingOnThem > 0 && ` · ${client.waitingOnThem} waiting on them`}
      </p>
    </Link>
  );
}

/** Today: what needs Obi across every system, what's coming up, and how the month is going. */
export default function TodayPage() {
  const [data, setData] = React.useState<Today | null>(null);
  const [error, setError] = React.useState("");
  const [now, setNow] = React.useState<Date | null>(null);

  const load = React.useCallback(() => {
    return fetch("/api/admin/today", { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
        setData(body);
        setNow(new Date());
        setError("");
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  React.useEffect(() => {
    void load();
    // Coming back to the tab brings it up to date.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  if (!data || !now) {
    if (error) {
      return (
        <PageContainer>
          <PageHeader title="Today" />
          <p className="text-sm text-[hsl(var(--color-error))]">Today didn&apos;t load: {error}</p>
        </PageContainer>
      );
    }
    return <AdminLoader message="Getting today ready..." />;
  }

  const needs = data.outreach.inboxError
    ? [
        ...data.needs,
        {
          id: "inbox",
          kind: "drafts" as const,
          title: "The outreach inbox couldn't be read",
          detail: data.outreach.inboxError,
          href: "/admin/outreach",
          at: data.outreach.inboxReadAt,
        },
      ]
    : data.needs;
  const calls = data.upcoming.filter((item) => !item.allDay).length;
  const summary = [
    needs.length === 0 ? "Nothing needs you right now" : `${needs.length} thing${needs.length === 1 ? "" : "s"} need${needs.length === 1 ? "s" : ""} you`,
    calls > 0 ? `${calls} call${calls === 1 ? "" : "s"} in the next fortnight` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PageContainer>
        <motion.div variants={fadeUp}>
          <PageHeader eyebrow={longDate(now)} title={`${greeting(now)}, Obi`} subtitle={summary} />
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Figure label="Visits this week" value={count(data.numbers.visits)} note={`${count(data.numbers.views)} page views · ${change(data.numbers.views, data.numbers.viewsBefore)}`} href="/admin/analytics" />
          <Figure label="Enquiries, last 30 days" value={count(data.numbers.enquiries)} note="From the site, Ask Craefto, calls and outreach" href="/admin/leads" />
          <Figure
            label="Ask Craefto this week"
            value={count(data.numbers.chats)}
            note={data.numbers.unanswered > 0 ? `${data.numbers.unanswered} question${data.numbers.unanswered === 1 ? "" : "s"} it couldn't answer` : "Every question answered"}
            href="/admin/chats"
          />
          <Figure
            label={`Outreach · ${MODE_LABEL[data.outreach.mode]}`}
            value={count(data.outreach.sentToday)}
            note={`Sent in the last day · ${data.outreach.queued} approved, waiting`}
            href="/admin/outreach"
          />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card padding="none">
              <div className="flex items-baseline justify-between gap-4 px-5 pb-2 pt-5 md:px-6">
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">Needs you</h2>
                {needs.length > 0 && <span className="font-mono text-sm tabular-nums text-[hsl(var(--color-foreground-subtle))]">{needs.length}</span>}
              </div>
              {needs.length > 0 ? (
                <ul className="px-2 pb-3 md:px-2">
                  {needs.map((need) => (
                    <NeedRow key={need.id} need={need} now={now} />
                  ))}
                </ul>
              ) : (
                <div className="px-5 pb-8 pt-2 md:px-6">
                  <p className="text-[hsl(var(--color-foreground-muted))]">All clear. New enquiries, client messages, estimates to confirm and outreach replies show up here.</p>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">Coming up</h2>
              <p className="mb-4 mt-0.5 text-xs text-[hsl(var(--color-foreground-subtle))]">The next fortnight, in Sydney time</p>
              {data.upcoming.length > 0 ? (
                <UpcomingList items={data.upcoming} now={now} />
              ) : (
                <p className="text-sm text-[hsl(var(--color-foreground-muted))]">No calls or delivery dates yet. Discovery Calls, client calls and approved delivery dates appear here.</p>
              )}
            </Card>
          </motion.div>
        </div>

        <motion.div variants={fadeUp}>
          <Section
            title="Clients this month"
            description="Hours used, approved work still to do, and what's open"
            actions={
              <Link href="/admin/members" className="text-sm font-medium text-[hsl(var(--color-accent))] hover:underline">
                All clients
              </Link>
            }
          >
            {data.clients.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.clients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">No clients with hours or a running plan yet.</p>
            )}
          </Section>
        </motion.div>
      </PageContainer>
    </motion.div>
  );
}
