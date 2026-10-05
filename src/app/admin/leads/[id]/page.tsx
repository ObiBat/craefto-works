"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import {
  IconArrowRight,
  IconBriefcase,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconFileText,
  IconInfo,
  IconMail,
  IconMessageSquare,
  IconPhone,
} from "@/components/admin/icons";
import { DetailSection, EmptyState, InfoField, PageContainer, PageHeader, StatusBadge } from "@/components/admin/ui";
import { LEAD_SOURCES, enquiryLabel } from "@/lib/enquiry";
import { StageSelect, saveStage, when, type Stage } from "../shared";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  website: string | null;
  source: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string | null;
  score: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  stage: Stage | null;
}

interface Activity {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  actor_type: string | null;
  created_at: string;
}

interface Reply {
  id: string;
  subject: string | null;
  label: string | null;
  summary: string | null;
  received_at: string | null;
  created_at: string;
}

interface LeadDetail {
  lead: Lead;
  activities: Activity[];
  chat: { id: string; turns: number; updated_at: string } | null;
  replies: Reply[];
  client: { id: string; name: string | null; company: string | null; user_id: string | null; monthly_hours: number | null } | null;
}

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  form_submission: <IconFileText size={15} />,
  email_sent: <IconMail size={15} />,
  note_added: <IconEdit size={15} />,
  meeting_scheduled: <IconCalendar size={15} />,
  meeting_cancelled: <IconCalendar size={15} />,
  stage_changed: <IconArrowRight size={15} />,
  call_logged: <IconPhone size={15} />,
};

const field =
  "w-full rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40";

/** Turns the lead into a portal client with monthly hours; nothing is sent until they're invited from their client page. */
function MakeClient({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function make(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/leads/${lead.id}/client`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) return setError(data?.error ?? "That didn't save. Try again.");
    router.push(`/admin/members/${data.id}`);
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">Once they&apos;ve agreed to work together, give them the client portal: requests, estimates, their hours and calls in one place.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xl bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--color-accent-hover))]"
        >
          Make them a client
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={make} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <label className="block space-y-1.5">
          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">Hours a month</span>
          <input name="monthly_hours" type="number" min="0.5" max="400" step="0.5" required className={field} placeholder="20" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">What the arrangement is called</span>
          <input name="engagement" className={field} defaultValue={`${lead.company || lead.name} monthly hours`} />
        </label>
      </div>
      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
        This makes their portal account for {lead.email} and moves the lead to Won. Nothing is sent: invite them from their client page when you&apos;re ready.
      </p>
      {error && (
        <p role="alert" className="text-sm text-[hsl(var(--color-error))]">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-xl bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--color-accent-hover))] disabled:opacity-60">
          {saving ? "Making…" : "Make them a client"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Linked({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-[hsl(var(--color-background-muted))]/40">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">{title}</span>
        <span className="block truncate text-sm text-[hsl(var(--color-foreground-muted))]">{detail}</span>
      </span>
      <IconChevronRight size={16} className="shrink-0 text-[hsl(var(--color-foreground-subtle))]" />
    </Link>
  );
}

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = React.useState<LeadDetail | null>(null);
  const [stages, setStages] = React.useState<Stage[]>([]);
  const [missing, setMissing] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    return Promise.all([fetch(`/api/admin/leads/${id}`, { cache: "no-store" }), fetch("/api/admin/stages", { cache: "no-store" })])
      .then(async ([leadRes, stagesRes]) => {
        if (!leadRes.ok) throw new Error(String(leadRes.status));
        setDetail(await leadRes.json());
        if (stagesRes.ok) setStages((await stagesRes.json()).stages ?? []);
      })
      .catch(() => setMissing(true));
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function moveTo(stageId: string) {
    if (!detail) return;
    const stage = stages.find((entry) => entry.id === stageId) ?? null;
    setDetail({ ...detail, lead: { ...detail.lead, stage } });
    if (await saveStage(detail.lead.id, stageId)) void load();
    else setDetail(detail);
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!detail || !note.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/leads/${detail.lead.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) {
      setNote("");
      void load();
    }
  }

  if (missing) return <EmptyState title="Lead not found" description="It may have been removed." action={<Link href="/admin/leads" className="text-sm text-[hsl(var(--color-accent))] hover:underline">Back to leads</Link>} />;
  if (!detail) return <AdminLoader message="Loading lead..." />;

  const { lead, activities, chat, replies, client } = detail;
  const source = LEAD_SOURCES[lead.source ?? ""] ?? "Enquiry";
  const place = [lead.city, lead.country].filter(Boolean).join(", ");
  const campaign = [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" · ");
  const website = lead.website ? (lead.website.startsWith("http") ? lead.website : `https://${lead.website}`) : null;

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={
          <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
            <IconChevronLeft size={16} /> Leads
          </Link>
        }
        eyebrow={`${source} · ${when(lead.created_at, true)}`}
        title={lead.name}
        subtitle={[lead.company, lead.email].filter(Boolean).join(" · ")}
        actions={
          <>
            <StageSelect stages={stages} value={lead.stage?.id ?? null} onChange={moveTo} label="Lead stage" />
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--color-border))] px-4 py-2 text-sm font-medium transition-colors hover:bg-[hsl(var(--color-background-subtle))]"
            >
              <IconMail size={16} /> Email
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="What they said">
            {lead.message ? (
              <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--color-foreground))]">{lead.message}</p>
            ) : (
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">No message with this one.</p>
            )}
          </DetailSection>

          <DetailSection title="Details">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoField label="Email" value={lead.email} href={`mailto:${lead.email}`} />
              {lead.phone && <InfoField label="Phone" value={lead.phone} href={`tel:${lead.phone}`} />}
              {website && <InfoField label="Website" value={lead.website} href={website} external />}
              <InfoField label="Looking for" value={enquiryLabel(lead.service_interest) ?? "Not said"} />
              <InfoField label="Budget" value={enquiryLabel(lead.budget_range) ?? "Not said"} />
              <InfoField label="Timeline" value={enquiryLabel(lead.timeline) ?? "Not said"} />
              <InfoField label="Score" value={`${lead.score} / 100`} />
              {place && <InfoField label="Where" value={place} />}
              {lead.landing_page && <InfoField label="Came in on" value={lead.landing_page} />}
              {campaign && <InfoField label="Campaign" value={campaign} />}
            </div>
          </DetailSection>

          <DetailSection title="Connected">
            <div className="-mx-3 space-y-1">
              {chat && <Linked href={`/admin/chats/${chat.id}`} icon={<IconMessageSquare size={18} />} title="Their Ask Craefto chat" detail={`${chat.turns} message${chat.turns === 1 ? "" : "s"} · ${when(chat.updated_at, true)}`} />}
              {replies.map((reply) => (
                <Linked
                  key={reply.id}
                  href={`/admin/outreach/replies/${reply.id}`}
                  icon={<IconMail size={18} />}
                  title={reply.subject ? `Outreach reply: ${reply.subject}` : "Their outreach reply"}
                  detail={[reply.label ? reply.label.charAt(0).toUpperCase() + reply.label.slice(1) : null, when(reply.received_at ?? reply.created_at)].filter(Boolean).join(" · ")}
                />
              ))}
              {client && (
                <Linked
                  href={`/admin/members/${client.id}`}
                  icon={<IconBriefcase size={18} />}
                  title="Their client page"
                  detail={client.user_id ? "Signed in to the portal" : "Not signed in yet: send the invite from their page"}
                />
              )}
            </div>
            {!client && (
              <div className={chat || replies.length ? "mt-4 border-t border-[hsl(var(--color-border))]/50 pt-4" : undefined}>
                <MakeClient lead={lead} />
              </div>
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Add a note">
            <form onSubmit={addNote} className="space-y-3">
              <textarea
                aria-label="Note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="What happened, what's next…"
                className={`${field} resize-y`}
              />
              <button
                type="submit"
                disabled={!note.trim() || saving}
                className="rounded-xl bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add note"}
              </button>
            </form>
          </DetailSection>

          <DetailSection title="Activity">
            {activities.length === 0 ? (
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">Nothing yet.</p>
            ) : (
              <ol className="space-y-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]" aria-hidden="true">
                      {ACTIVITY_ICON[activity.type] ?? <IconInfo size={15} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">
                        {activity.title ?? activity.type.replace(/_/g, " ")}
                        {activity.type === "meeting_cancelled" && (
                          <span className="ml-2 align-middle">
                            <StatusBadge variant="warning">Cancelled</StatusBadge>
                          </span>
                        )}
                      </p>
                      {activity.description && <p className="mt-0.5 whitespace-pre-wrap text-sm text-[hsl(var(--color-foreground-muted))]">{activity.description}</p>}
                      <p className="mt-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                        {when(activity.created_at, true)}
                        {activity.actor_type === "admin" && " · you"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </DetailSection>
        </div>
      </div>
    </PageContainer>
  );
}
