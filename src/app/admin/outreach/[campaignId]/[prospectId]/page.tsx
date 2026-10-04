"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { DetailSection, EmptyState } from "@/components/admin/ui";
import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconChevronLeft, IconChevronRight, IconExternal, IconX } from "@/components/admin/icons";
import { EDITABLE, type ApprovalCheck, type OutreachMessage, type Priority, type Prospect, type ProspectSummary, type SendingMode, type StatusAction } from "@/lib/outreach/types";
import { api, byPriority, formatDay, formatWhen, hostOf, PriorityBadge, StatusPill, tabFor } from "../../shared";

interface Loaded {
  prospect: Prospect;
  check: ApprovalCheck;
  messages?: OutreachMessage[];
}

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${button} bg-[hsl(var(--color-accent))] text-black hover:bg-[hsl(var(--color-accent-hover))]`;
const secondary = `${button} border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]`;
const field =
  "w-full rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))] px-3 py-2.5 text-[15px] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40";

/** Only web addresses become links (the research could hold anything). */
const web = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url);

/** The next steps offered for each status, as in the command centre. */
const STEPS: Partial<Record<Prospect["status"], { action: StatusAction; label: string }[]>> = {
  approved: [{ action: "draft", label: "Back to draft" }],
  sent: [
    { action: "replied", label: "They replied" },
    { action: "lost", label: "Lost" },
  ],
  replied: [
    { action: "meeting", label: "Meeting booked" },
    { action: "lost", label: "Lost" },
  ],
  meeting: [
    { action: "won", label: "Won" },
    { action: "lost", label: "Lost" },
  ],
};

const DONE: Partial<Record<StatusAction, string>> = {
  approve: "Approved.",
  draft: "Back to draft.",
  sent: "Marked as sent today.",
  replied: "Marked as replied.",
  meeting: "Meeting booked.",
  won: "Marked as won.",
  lost: "Marked as lost.",
  "not-a-fit": "Marked not a fit.",
  reopen: "Reopened.",
};

function ProspectPage() {
  const { campaignId, prospectId } = useParams<{ campaignId: string; prospectId: string }>();
  const tab = tabFor(useSearchParams().get("tab"));
  const base = `/api/admin/outreach/${campaignId}/${prospectId}`;
  const [data, setData] = React.useState<Loaded | null>(null);
  const [missing, setMissing] = React.useState("");
  const [queue, setQueue] = React.useState<ProspectSummary[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ subject: "", body: "" });
  const [notes, setNotes] = React.useState("");
  const [mode, setMode] = React.useState<SendingMode>("off");

  const load = React.useCallback(async () => {
    const loaded = await api<Loaded>(base);
    setData(loaded);
    setNotes(loaded.prospect.notes ?? "");
    return loaded;
  }, [base]);

  React.useEffect(() => {
    setData(null);
    setMissing("");
    setMessage(null);
    setEditing(false);
    load().catch((error: Error) => setMissing(error.message));
    api<{ prospects: ProspectSummary[]; sending?: { mode: SendingMode } }>("/api/admin/outreach?view=summary")
      .then(({ prospects, sending }) => {
        setQueue(prospects.filter((p) => tab.statuses.includes(p.status)).sort(byPriority));
        setMode(sending?.mode ?? "off");
      })
      .catch(() => setQueue([]));
  }, [load, tab]);

  // Confirmations fade after a while; errors stay until dismissed or reloaded.
  React.useEffect(() => {
    if (message?.tone !== "ok") return;
    const timer = setTimeout(() => setMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [message]);

  const run = async (key: string, task: () => Promise<Loaded>, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const next = await task();
      setData(next);
      setNotes(next.prospect.notes ?? "");
      setMessage({ tone: "ok", text: done });
      return true;
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (missing) {
    return (
      <EmptyState
        title="Couldn't open this prospect"
        description={missing}
        action={
          <Link href="/admin/outreach" className="text-sm text-[hsl(var(--color-accent))] hover:underline">
            Back to outreach
          </Link>
        }
      />
    );
  }
  if (!data) return <AdminLoader message="Loading prospect..." />;

  const { prospect: p, check } = data;
  const tabQuery = tab.id === "approve" ? "" : `?tab=${tab.id}`;
  const href = (item: { campaignId: string; id: string }) => `/admin/outreach/${item.campaignId}/${item.id}${tabQuery}`;
  const at = queue.findIndex((item) => item.campaignId === p.campaignId && item.id === p.id);
  const prev = at > 0 ? queue[at - 1] : undefined;
  const next = at >= 0 ? queue[at + 1] : queue.find((item) => item.status === "drafted");
  const closed = ["won", "lost", "not-a-fit"].includes(p.status);
  const canEdit = EDITABLE.includes(p.status);
  const dirtyNotes = notes !== (p.notes ?? "");

  const act = (action: StatusAction) =>
    run(action, () => api<Loaded>(`${base}/status`, { action, ...(action === "approve" ? { hash: p.emailHash } : {}) }), DONE[action] ?? "Saved.");

  const saveEmail = async () => {
    const wasApproved = p.status === "approved";
    const saved = await run(
      "save",
      () => api<Loaded>(base, { email: { subject: draft.subject.trim(), body: draft.body.trim() } }, "PUT"),
      wasApproved ? "Saved. The email changed, so it needs approving again." : "Email saved.",
    );
    if (saved) setEditing(false);
  };

  // Live sending emails approved addresses itself: no Open in Mail, so nothing goes twice.
  const queued = mode === "live" && p.status === "approved" && p.contact.kind === "email";
  const suppressed = check.blocks.some((block) => block.includes("do-not-email list"));

  const mailto =
    p.contact.kind === "email" && p.email
      ? `mailto:${p.contact.value}?subject=${encodeURIComponent(p.email.subject)}&body=${encodeURIComponent(p.email.body)}`
      : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/admin/outreach${tabQuery}`}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl pr-3 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
        >
          <IconChevronLeft size={16} /> Outreach
        </Link>
        <nav className="flex items-center gap-1 text-sm text-[hsl(var(--color-foreground-subtle))]" aria-label="Other prospects">
          {at >= 0 && (
            <span className="mr-1 tabular-nums">
              {at + 1} of {queue.length}
            </span>
          )}
          {prev && (
            <Link href={href(prev)} aria-label={`Previous: ${prev.company}`} className="grid size-11 place-items-center rounded-xl hover:bg-[hsl(var(--color-background-muted))]">
              <IconChevronLeft size={18} />
            </Link>
          )}
          {next && (
            <Link href={href(next)} aria-label={`Next: ${next.company}`} className="grid size-11 place-items-center rounded-xl hover:bg-[hsl(var(--color-background-muted))]">
              <IconChevronRight size={18} />
            </Link>
          )}
        </nav>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <PriorityBadge priority={p.priority} />
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[hsl(var(--color-foreground))] md:text-3xl">{p.company}</h1>
          <StatusPill status={p.status} />
        </div>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
          {[p.segment, p.location].filter(Boolean).join(" · ")}
          {web(p.website) && (
            <>
              {" · "}
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[hsl(var(--color-accent))] hover:underline">
                {hostOf(p.website)} <IconExternal size={12} />
              </a>
            </>
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {(p.status === "drafted" || p.status === "approved") && (check.blocks.length > 0 || check.warnings.length > 0) && (
            <section aria-label="Before approving" className="space-y-2">
              {check.blocks.map((text) => (
                <p key={text} className="flex gap-2 rounded-xl border border-[hsl(var(--color-error))]/25 bg-[hsl(var(--color-error-subtle))] px-4 py-3 text-sm text-[hsl(var(--color-error))]">
                  <IconAlertCircle size={18} className="mt-px shrink-0" /> {text}
                </p>
              ))}
              {check.warnings.map((text) => (
                <p key={text} className="flex gap-2 rounded-xl border border-[hsl(var(--color-warning))]/25 bg-[hsl(var(--color-warning-subtle))] px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                  <IconAlertTriangle size={18} className="mt-px shrink-0 text-[hsl(var(--color-warning))]" /> {text}
                </p>
              ))}
            </section>
          )}

          <DetailSection title="Email">
            <dl className="mb-4 grid grid-cols-[56px_minmax(0,1fr)] gap-y-2 text-sm">
              <dt className="text-[hsl(var(--color-foreground-subtle))]">To</dt>
              <dd className="min-w-0 break-words">
                {p.contact.kind === "email" && <span className="font-medium text-[hsl(var(--color-foreground))]">{p.contact.value}</span>}
                {p.contact.kind === "form" && web(p.contact.value) && (
                  <a href={p.contact.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[hsl(var(--color-accent))] hover:underline">
                    Contact form <IconExternal size={12} />
                  </a>
                )}
                {p.contact.kind === "none" && <span className="text-[hsl(var(--color-error))]">No published contact route</span>}
                {p.contact.source && (
                  <span className="block text-xs text-[hsl(var(--color-foreground-subtle))]">
                    {web(p.contact.source) ? (
                      <a href={p.contact.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Published at {p.contact.source.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    ) : (
                      p.contact.source
                    )}
                  </span>
                )}
              </dd>
              {!editing && p.email && (
                <>
                  <dt className="text-[hsl(var(--color-foreground-subtle))]">Subject</dt>
                  <dd className="font-medium text-[hsl(var(--color-foreground))]">{p.email.subject}</dd>
                </>
              )}
            </dl>

            {editing ? (
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">Subject</span>
                  <input className={field} value={draft.subject} maxLength={200} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">Email</span>
                  <textarea
                    className={`${field} min-h-[22rem] leading-relaxed`}
                    value={draft.body}
                    maxLength={6000}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={primary} disabled={busy !== null || (draft.subject === p.email?.subject && draft.body === p.email?.body)} onClick={() => void saveEmail()}>
                    {busy === "save" ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className={secondary} disabled={busy !== null} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : p.email ? (
              <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[hsl(var(--color-foreground))]">{p.email.body}</div>
            ) : (
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">No email yet. Draft it in the command centre, or write it here.</p>
            )}

            {p.email?.approvedAt && (
              <p className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                <IconCheckCircle size={16} className="text-[hsl(var(--color-success))]" />
                Approved {formatWhen(p.email.approvedAt)}
                {p.email.approvedBy === "command-centre" ? " in the command centre" : p.email.approvedBy === "admin" ? " in admin" : ""}
                {p.email.sentAt ? ` · sent ${formatDay(p.email.sentAt)}` : ""}
              </p>
            )}
            {!p.email?.approvedAt && p.email?.sentAt && <p className="mt-4 text-sm text-[hsl(var(--color-foreground-muted))]">Sent {formatDay(p.email.sentAt)}</p>}

            {!editing && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-[hsl(var(--color-border))]/40 pt-5">
                {p.status === "drafted" && (
                  <button type="button" className={primary} disabled={busy !== null || check.blocks.length > 0} onClick={() => void act("approve")}>
                    <IconCheckCircle size={18} /> {busy === "approve" ? "Approving..." : "Approve"}
                  </button>
                )}
                {p.status === "approved" && p.contact.kind === "form" && (
                  <p className="w-full text-sm text-[hsl(var(--color-foreground-muted))]">
                    Contact form: the sender only emails addresses, so send this one yourself through their form (the link above), then mark it sent.
                  </p>
                )}
                {queued && (
                  <p className="w-full text-sm text-[hsl(var(--color-foreground-muted))]">
                    Queued: the sender emails it from obi@craefto.com in their working hours, after checking the address is still published. Back to draft stops it.
                  </p>
                )}
                {p.status === "approved" && mailto && !queued && (
                  <a href={mailto} className={primary}>
                    Open in Mail
                  </a>
                )}
                {p.status === "approved" && !queued && (
                  <button type="button" className={secondary} disabled={busy !== null} onClick={() => void act("sent")}>
                    Mark sent today
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    className={secondary}
                    disabled={busy !== null}
                    onClick={() => {
                      setDraft({ subject: p.email?.subject ?? "", body: p.email?.body ?? "" });
                      setEditing(true);
                      setMessage(null);
                    }}
                  >
                    {p.email ? "Edit" : "Write email"}
                  </button>
                )}
                {(STEPS[p.status] ?? []).map((step) => (
                  <button key={step.action} type="button" className={secondary} disabled={busy !== null} onClick={() => void act(step.action)}>
                    {step.label}
                  </button>
                ))}
                {!closed && (
                  <button type="button" className={`${secondary} text-[hsl(var(--color-error))]`} disabled={busy !== null} onClick={() => void act("not-a-fit")}>
                    Not a fit
                  </button>
                )}
                {closed && (
                  <button type="button" className={secondary} disabled={busy !== null} onClick={() => void act("reopen")}>
                    Reopen
                  </button>
                )}
              </div>
            )}
          </DetailSection>

          {!!data.messages?.length && (
            <DetailSection title="Emails sent">
              <ul className="space-y-3">
                {data.messages.map((sent) => (
                  <li key={sent.id} className="text-sm">
                    <p className="text-[hsl(var(--color-foreground))]">
                      {sent.mode === "test" ? "Test copy" : sent.kind === "follow-up" ? "Follow-up" : "First email"} to {sent.to}
                      <span className={`ml-2 text-xs font-medium ${sent.status === "sent" ? "text-[hsl(var(--color-success))]" : sent.status === "sending" ? "text-[hsl(var(--color-warning))]" : "text-[hsl(var(--color-error))]"}`}>{sent.status}</span>
                    </p>
                    <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                      {formatWhen(sent.sentAt ?? sent.createdAt)}
                      {sent.savedToSent ? " · copy in Sent" : ""}
                      {sent.evidence?.manual ? " · address confirmed by hand" : sent.evidence?.ok ? " · address confirmed on its page" : ""}
                      {sent.error ? ` · ${sent.error}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {p.followUp && (
            <DetailSection title="Follow-up">
              <p className="mb-3 text-sm text-[hsl(var(--color-foreground-muted))]">
                {p.followUp.sentAt ? `Sent ${formatDay(p.followUp.sentAt)}` : `Due ${formatDay(p.followUp.dueAt)}`}
              </p>
              <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[hsl(var(--color-foreground))]">{p.followUp.body}</div>
            </DetailSection>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {p.contact.kind === "email" && (
            <DetailSection title="Published address">
              <p className="text-sm text-[hsl(var(--color-foreground))]">
                {!p.evidence
                  ? "Checked just before sending: the address must still be on the page it was published on, with no notice refusing unsolicited email."
                  : p.evidence.manual
                    ? `Confirmed by hand ${formatWhen(p.evidence.manual.at)}: good for 30 days of sending.`
                    : p.evidence.ok
                      ? `On the page when checked ${formatWhen(p.evidence.checkedAt)}.`
                      : `Couldn't confirm it ${formatWhen(p.evidence.checkedAt)}: ${p.evidence.error ?? p.evidence.notice ?? "unknown"}.`}
              </p>
              {p.evidence?.notice && <p className="mt-2 rounded-lg bg-[hsl(var(--color-warning-subtle))] px-3 py-2 text-xs text-[hsl(var(--color-foreground))]">“{p.evidence.notice}”</p>}
              {p.evidence?.otherAddresses?.length ? <p className="mt-2 text-xs text-[hsl(var(--color-foreground-muted))]">The page shows: {p.evidence.otherAddresses.join(", ")}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={secondary} disabled={busy !== null} onClick={() => void run("evidence", () => api<Loaded>(`${base}/evidence`, { action: "check" }), "Checked again.").then(() => void load())}>
                  {busy === "evidence" ? "Checking..." : "Check again"}
                </button>
                {!p.evidence?.ok && (
                  <button type="button" className={secondary} disabled={busy !== null} onClick={() => void run("confirm", () => api<Loaded>(`${base}/evidence`, { action: "confirm" }), "Confirmed: it can send for the next 30 days.").then(() => void load())}>
                    I&apos;ve checked it&apos;s published
                  </button>
                )}
                {!suppressed && (
                  <button
                    type="button"
                    className={`${secondary} text-[hsl(var(--color-error))]`}
                    disabled={busy !== null}
                    onClick={() =>
                      void run("suppress", async () => {
                        await api("/api/admin/outreach/suppressions", { value: p.contact.value, note: `Added from ${p.company}'s page` });
                        return api<Loaded>(base);
                      }, `${p.contact.value} won't be emailed again.`)
                    }
                  >
                    Don&apos;t email them
                  </button>
                )}
              </div>
            </DetailSection>
          )}

          {(p.whyFit || p.findings.length > 0) && (
            <DetailSection title="Research">
              {p.whyFit && <p className="mb-4 text-sm leading-relaxed text-[hsl(var(--color-foreground))]">{p.whyFit}</p>}
              {p.findings.length > 0 && (
                <ul className="space-y-3">
                  {p.findings.map((finding, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <p className="text-[hsl(var(--color-foreground))]">{finding.text}</p>
                      <p className="mt-0.5 text-xs text-[hsl(var(--color-foreground-subtle))]">
                        Checked {finding.checkedAt}
                        {web(finding.source) && (
                          <>
                            {" · "}
                            <a href={finding.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {hostOf(finding.source)}
                            </a>
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          )}

          {(p.journey?.length || p.systems?.length || p.metrics || p.applicationMethod) && (
            <DetailSection title="Their website">
              <dl className="space-y-3 text-sm">
                {p.metrics?.mobileSeconds !== undefined && (
                  <div>
                    <dt className="text-xs text-[hsl(var(--color-foreground-subtle))]">On a phone</dt>
                    <dd className="text-[hsl(var(--color-foreground))]">
                      {p.metrics.mobileSeconds}s, {p.metrics.mobileMB} MB{p.metrics.overflowPx ? `, ${p.metrics.overflowPx}px wider than the screen` : ""}
                      {p.checkedAt ? ` (checked ${p.checkedAt.slice(0, 10)})` : ""}
                    </dd>
                  </div>
                )}
                {p.applicationMethod && (
                  <div>
                    <dt className="text-xs text-[hsl(var(--color-foreground-subtle))]">How they take applications</dt>
                    <dd className="text-[hsl(var(--color-foreground))]">{p.applicationMethod}</dd>
                  </div>
                )}
                {!!p.journey?.length && (
                  <div>
                    <dt className="text-xs text-[hsl(var(--color-foreground-subtle))]">Platforms a renter passes through</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {p.journey.map((name) => (
                        <span key={name} className="rounded-lg bg-[hsl(var(--color-background-muted))] px-2 py-1 text-xs text-[hsl(var(--color-foreground))]">
                          {name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {!!p.systems?.length && (
                  <div>
                    <dt className="text-xs text-[hsl(var(--color-foreground-subtle))]">Systems found</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {p.systems.map((system) => (
                        <span key={`${system.name}-${system.category}`} title={system.evidence} className="rounded-lg bg-[hsl(var(--color-background-muted))] px-2 py-1 text-xs text-[hsl(var(--color-foreground))]">
                          {system.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </DetailSection>
          )}

          <DetailSection title="Priority and notes">
            <div className="mb-4 flex gap-2" role="group" aria-label="Priority">
              {(["A", "B", "C"] as Priority[]).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  aria-pressed={p.priority === priority}
                  disabled={busy !== null}
                  onClick={() => p.priority !== priority && void run("priority", () => api<Loaded>(base, { priority }, "PUT"), `Priority ${priority}.`)}
                  className={`size-11 rounded-xl border text-sm font-semibold transition-colors ${
                    p.priority === priority
                      ? "border-[hsl(var(--color-accent))]/40 bg-[hsl(var(--color-accent))]/15 text-[hsl(var(--color-accent))]"
                      : "border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground-muted))] hover:bg-[hsl(var(--color-background-muted))]"
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
            <label className="block text-sm">
              <span className="sr-only">Notes</span>
              <textarea className={`${field} min-h-24`} placeholder="Notes" value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)} />
            </label>
            {dirtyNotes && (
              <button type="button" className={`${secondary} mt-2`} disabled={busy !== null} onClick={() => void run("notes", () => api<Loaded>(base, { notes }, "PUT"), "Notes saved.")}>
                Save notes
              </button>
            )}
          </DetailSection>

          <DetailSection title="History">
            <ol className="space-y-2.5">
              {p.timeline.slice(0, 40).map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                  <span className="tabular-nums text-xs leading-5 text-[hsl(var(--color-foreground-subtle))]">{formatWhen(entry.at)}</span>
                  <span className="text-[hsl(var(--color-foreground))]">{entry.event}</span>
                </li>
              ))}
            </ol>
          </DetailSection>
        </div>
      </div>

      {/* Pinned to the bottom of the screen: on a phone the buttons are far from the top of the page. */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {message && (
          <div
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-[hsl(var(--color-background))] px-4 py-3 text-sm text-[hsl(var(--color-foreground))] shadow-lg shadow-black/10 ${
              message.tone === "ok" ? "border-[hsl(var(--color-success))]/40" : "border-[hsl(var(--color-error))]/40"
            }`}
          >
            {message.tone === "ok" ? (
              <IconCheckCircle size={18} className="mt-px shrink-0 text-[hsl(var(--color-success))]" />
            ) : (
              <IconAlertCircle size={18} className="mt-px shrink-0 text-[hsl(var(--color-error))]" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p>{message.text}</p>
              {message.tone === "ok" && p.status === "approved" && next && (
                <Link href={href(next)} className="block font-medium text-[hsl(var(--color-accent))] underline-offset-2 hover:underline">
                  Next: {next.company} →
                </Link>
              )}
              {message.tone === "error" && (
                <button type="button" className="font-medium text-[hsl(var(--color-accent))] underline-offset-2 hover:underline" onClick={() => void load().then(() => setMessage(null))}>
                  Reload
                </button>
              )}
            </div>
            <button type="button" aria-label="Dismiss" className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-[hsl(var(--color-foreground-subtle))] hover:bg-[hsl(var(--color-background-muted))]" onClick={() => setMessage(null)}>
              <IconX size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutreachProspectPage() {
  return (
    <React.Suspense fallback={<AdminLoader message="Loading prospect..." />}>
      <ProspectPage />
    </React.Suspense>
  );
}
