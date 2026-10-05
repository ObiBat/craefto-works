"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { DetailSection, EmptyState } from "@/components/admin/ui";
import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconChevronLeft, IconExternal, IconX } from "@/components/admin/icons";
import { REPLY_EFFECT, REPLY_LABEL, REPLY_LABELS, type OutreachMessage, type OutreachReply, type Prospect, type ReplyLabel } from "@/lib/outreach/types";
import { api, formatDay, formatWhen, ReplyBadge, StatusPill } from "../../shared";

type ThreadItem = { at: string; ours?: OutreachMessage; theirs?: OutreachReply };

interface Loaded {
  reply: OutreachReply;
  prospect: Prospect;
  thread: ThreadItem[];
  suppressed: { value: string; reason: string } | null;
  handover?: { leadId: string | null; created: boolean; test: boolean };
}

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${button} bg-[hsl(var(--color-accent))] text-black hover:bg-[hsl(var(--color-accent-hover))]`;
const secondary = `${button} border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]`;
const field =
  "w-full rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))] px-3 py-2.5 text-[15px] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40";

/** Labels whose date matters: when they're back, or when to try again. */
const DATED: ReplyLabel[] = ["out-of-office", "not-now"];

/** How the label was given, in words. */
function labelSource(reply: OutreachReply) {
  if (reply.labelSource === "manual") return reply.correctedFrom ? `Corrected by you (it was ${REPLY_LABEL[reply.correctedFrom]})` : "Set by you";
  if (reply.labelSource === "rule") {
    if (reply.label === "unclear") return "The AI couldn't be reached in time, so it's waiting for you";
    return reply.aiLabel ? `Set by its wording (the AI wasn't sure: it said ${REPLY_LABEL[reply.aiLabel]})` : "Set by a fixed rule";
  }
  const sure = reply.confidence !== null ? `${Math.round(reply.confidence * 100)}% sure` : "";
  return reply.label === "unclear" && reply.aiLabel ? `The AI guessed ${REPLY_LABEL[reply.aiLabel]}${sure ? `, only ${sure}` : ""}` : `By the AI${sure ? `, ${sure}` : ""}`;
}

/** Their words, with the line the label rests on marked. */
function Marked({ text, quote }: { text: string; quote: string | null }) {
  const at = quote ? text.toLowerCase().indexOf(quote.toLowerCase()) : -1;
  if (!quote || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded bg-[hsl(var(--color-accent))]/20 px-0.5 text-inherit">{text.slice(at, at + quote.length)}</mark>
      {text.slice(at + quote.length)}
    </>
  );
}

function ReplyPage() {
  const { replyId } = useParams<{ replyId: string }>();
  const base = `/api/admin/outreach/replies/${replyId}`;
  const [data, setData] = React.useState<Loaded | null>(null);
  const [missing, setMissing] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ tone: "ok" | "error"; text: string; lead?: string } | null>(null);
  const [answer, setAnswer] = React.useState("");
  const [confirmSend, setConfirmSend] = React.useState(false);
  const [showFull, setShowFull] = React.useState(false);
  const [label, setLabel] = React.useState<{ value: ReplyLabel; returnOn: string }>({ value: "unclear", returnOn: "" });

  const take = React.useCallback((loaded: Loaded) => {
    setData(loaded);
    setAnswer(loaded.reply.suggestedReply ?? "");
    setLabel({ value: loaded.reply.label, returnOn: loaded.reply.returnOn ?? "" });
    return loaded;
  }, []);

  const load = React.useCallback(() => api<Loaded>(base).then(take), [base, take]);

  React.useEffect(() => {
    load().catch((error: Error) => setMissing(error.message));
  }, [load]);

  React.useEffect(() => {
    if (message?.tone !== "ok") return;
    const timer = setTimeout(() => setMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [message]);

  const run = async (key: string, task: () => Promise<Loaded>, done: string | ((loaded: Loaded) => string)) => {
    setBusy(key);
    setMessage(null);
    try {
      const next = take(await task());
      setMessage({ tone: "ok", text: typeof done === "string" ? done : done(next), lead: next.reply.leadId ?? undefined });
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
        title="Couldn't open this reply"
        description={missing}
        action={
          <Link href="/admin/outreach/replies" className="text-sm text-[hsl(var(--color-accent))] hover:underline">
            Back to replies
          </Link>
        }
      />
    );
  }
  if (!data) return <AdminLoader message="Loading reply..." />;

  const { reply, prospect: p, thread, suppressed } = data;
  const answered = thread.find((item) => item.ours?.kind === "reply" && item.ours.answersReply === reply.id && item.ours.status === "sent")?.ours;
  const dirty = answer !== (reply.suggestedReply ?? "");
  const labelChanged = label.value !== reply.label || (DATED.includes(label.value) && label.returnOn !== (reply.returnOn ?? ""));
  const canAnswer = !answered && !(reply.mode === "live" && suppressed) && reply.label !== "bounce";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <Link href="/admin/outreach/replies" className="inline-flex min-h-11 items-center gap-1 rounded-xl pr-3 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
        <IconChevronLeft size={16} /> Replies
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[hsl(var(--color-foreground))] md:text-3xl">{p.company}</h1>
          <ReplyBadge label={reply.label} />
          {reply.mode === "test" && <span className="rounded-full border border-[hsl(var(--color-border))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--color-foreground-muted))]">Test reply</span>}
        </div>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
          {reply.fromName ? `${reply.fromName} · ` : ""}
          {reply.fromAddress} · {formatWhen(reply.receivedAt)}
          {reply.mailbox !== "INBOX" ? ` · arrived in ${reply.mailbox}` : ""}
        </p>
      </header>

      {reply.mode === "test" && (
        <p className="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-subtle))] px-4 py-3 text-sm text-[hsl(var(--color-foreground-muted))]">
          A reply to a test copy: labelled and alerted like a real one, but nothing about the prospect changed.
        </p>
      )}
      {suppressed && reply.mode === "live" && (
        <p className="flex gap-2 rounded-xl border border-[hsl(var(--color-error))]/25 bg-[hsl(var(--color-error-subtle))] px-4 py-3 text-sm text-[hsl(var(--color-error))]">
          <IconAlertCircle size={18} className="mt-px shrink-0" /> {suppressed.value} is on the do-not-email list ({suppressed.reason}), so it can&apos;t be answered from here.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <DetailSection title="Their reply">
            {reply.subject && <p className="mb-3 text-sm font-medium text-[hsl(var(--color-foreground))]">{reply.subject}</p>}
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[hsl(var(--color-foreground))]">
              <Marked text={showFull && reply.fullText ? reply.fullText : reply.body} quote={reply.quote} />
            </div>
            {reply.fullText && (
              <button type="button" className="mt-3 text-sm font-medium text-[hsl(var(--color-accent))] hover:underline" onClick={() => setShowFull(!showFull)}>
                {showFull ? "Show only their new words" : "Show the whole email, quoted thread included"}
              </button>
            )}
          </DetailSection>

          {answered ? (
            <DetailSection title="Your answer">
              <p className="mb-3 flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
                <IconCheckCircle size={16} className="text-[hsl(var(--color-success))]" /> Sent {formatWhen(answered.sentAt ?? answered.createdAt)} to {answered.to}, in the same thread
              </p>
              <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[hsl(var(--color-foreground))]">{answered.body.split(/\n\nOn .+ wrote:\n/)[0]}</div>
            </DetailSection>
          ) : (
            <DetailSection title="Your answer">
              {canAnswer ? (
                <div className="space-y-3">
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                    {reply.suggestedReply ? "Suggested from what they wrote and Craefto's own facts. Read it, change what you like, then send." : "Write an answer, or ask the AI for a draft."} It goes from obi@craefto.com to {reply.fromAddress} with their email quoted below, in the same thread.
                  </p>
                  <textarea className={`${field} min-h-[20rem] leading-relaxed`} value={answer} maxLength={8000} onChange={(e) => { setAnswer(e.target.value); setConfirmSend(false); }} aria-label="Your answer" />
                  {confirmSend ? (
                    <div className="space-y-3 rounded-xl border border-[hsl(var(--color-accent))]/30 bg-[hsl(var(--color-background))] p-4 text-sm">
                      <p className="text-[hsl(var(--color-foreground))]">
                        Send this to {reply.fromAddress} now{reply.mode === "test" ? " (your test address)" : ""}?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={primary} disabled={busy !== null} onClick={() => void run("send", () => api<Loaded>(`${base}/answer`, { body: answer }), "Sent. It's in your Sent folder too.").then(() => setConfirmSend(false))}>
                          {busy === "send" ? "Sending..." : "Send it"}
                        </button>
                        <button type="button" className={secondary} disabled={busy !== null} onClick={() => setConfirmSend(false)}>
                          Not yet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={primary} disabled={busy !== null || !answer.trim()} onClick={() => setConfirmSend(true)}>
                        Send answer
                      </button>
                      {dirty && (
                        <button type="button" className={secondary} disabled={busy !== null} onClick={() => void run("save", () => api<Loaded>(base, { suggestedReply: answer }, "PATCH"), "Draft saved.")}>
                          {busy === "save" ? "Saving..." : "Save draft"}
                        </button>
                      )}
                      <button type="button" className={secondary} disabled={busy !== null} onClick={() => void run("draft", () => api<Loaded>(`${base}/draft`, {}), "A fresh draft from the AI.")}>
                        {busy === "draft" ? "Drafting..." : reply.suggestedReply ? "Draft again" : "Draft with AI"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{reply.label === "bounce" ? "A bounce: there's no one to answer." : "This one can't be answered from here."}</p>
              )}
            </DetailSection>
          )}

          <DetailSection title="Conversation">
            <ol className="space-y-4">
              {thread.map((item, i) => {
                const ours = item.ours;
                const theirs = item.theirs;
                return (
                  <li key={ours?.id ?? theirs?.id ?? i} className={`rounded-xl border px-4 py-3 text-sm ${theirs?.id === reply.id ? "border-[hsl(var(--color-accent))]/40" : "border-[hsl(var(--color-border))]/50"}`}>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                      <span className="tabular-nums">{formatWhen(item.at)}</span>
                      <span className="font-medium text-[hsl(var(--color-foreground-muted))]">
                        {ours ? (ours.kind === "initial" ? "Our first email" : ours.kind === "follow-up" ? "Our follow-up" : "Our answer") : theirs?.id === reply.id ? "This reply" : "Their reply"}
                      </span>
                      {theirs && theirs.id !== reply.id && (
                        <Link href={`/admin/outreach/replies/${theirs.id}`} className="text-[hsl(var(--color-accent))] hover:underline">
                          {REPLY_LABEL[theirs.label]}
                        </Link>
                      )}
                    </p>
                    <p className="mt-1.5 line-clamp-6 whitespace-pre-wrap break-words text-[hsl(var(--color-foreground))]">{ours ? ours.body.split(/\n\nOn .+ wrote:\n/)[0] : theirs?.body}</p>
                  </li>
                );
              })}
            </ol>
          </DetailSection>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Label">
            <div className="flex flex-wrap items-center gap-2">
              <ReplyBadge label={reply.label} />
              {reply.returnOn && DATED.includes(reply.label) && <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{reply.label === "out-of-office" ? "Back" : "Try again"} {formatDay(reply.returnOn)}</span>}
            </div>
            <p className="mt-2 text-xs text-[hsl(var(--color-foreground-subtle))]">{labelSource(reply)}</p>
            {reply.summary && <p className="mt-3 text-sm text-[hsl(var(--color-foreground))]">{reply.summary}</p>}
            {reply.mode === "live" && <p className="mt-2 text-sm text-[hsl(var(--color-foreground-muted))]">{REPLY_EFFECT[reply.label]}</p>}

            <div className="mt-4 space-y-2 border-t border-[hsl(var(--color-border))]/40 pt-4">
              <label className="block text-sm">
                <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">Correct it</span>
                <select className={field} value={label.value} onChange={(e) => setLabel({ ...label, value: e.target.value as ReplyLabel })}>
                  {REPLY_LABELS.map((value) => (
                    <option key={value} value={value}>
                      {REPLY_LABEL[value]}
                    </option>
                  ))}
                </select>
              </label>
              {DATED.includes(label.value) && (
                <label className="block text-sm">
                  <span className="mb-1 block text-[hsl(var(--color-foreground-subtle))]">{label.value === "out-of-office" ? "Back on" : "Try again on"}</span>
                  <input className={field} type="date" value={label.returnOn} onChange={(e) => setLabel({ ...label, returnOn: e.target.value })} />
                </label>
              )}
              {labelChanged && (
                <>
                  {reply.mode === "live" && <p className="text-xs text-[hsl(var(--color-foreground-muted))]">{REPLY_EFFECT[label.value]}</p>}
                  <button
                    type="button"
                    className={secondary}
                    disabled={busy !== null}
                    onClick={() =>
                      void run("label", () => api<Loaded>(base, { label: label.value, ...(DATED.includes(label.value) ? { returnOn: label.returnOn || null } : {}) }, "PATCH"), `Labelled ${REPLY_LABEL[label.value]}.`)
                    }
                  >
                    {busy === "label" ? "Saving..." : "Save label"}
                  </button>
                </>
              )}
            </div>
          </DetailSection>

          {reply.referral && (
            <DetailSection title="They pointed to">
              <p className="text-sm text-[hsl(var(--color-foreground))]">{[reply.referral.name, reply.referral.role].filter(Boolean).join(", ") || "Someone else"}</p>
              {reply.referral.email && <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{reply.referral.email}</p>}
              <p className="mt-2 text-xs text-[hsl(var(--color-foreground-subtle))]">Never emailed automatically: there&apos;s no consent for that address. Write to them yourself if it fits.</p>
            </DetailSection>
          )}

          <DetailSection title="Next">
            <div className="flex flex-col gap-2">
              {reply.leadId ? (
                <Link href={`/admin/leads/${reply.leadId}`} className={primary}>
                  Open the lead
                </Link>
              ) : (
                ["interested", "question", "referral"].includes(reply.label) && (
                  <button
                    type="button"
                    className={primary}
                    disabled={busy !== null}
                    onClick={() =>
                      void run("handover", () => api<Loaded>(`${base}/handover`, {}), (next) =>
                        next.handover?.test ? "A test reply: marked handled, no lead filed." : next.handover?.created ? "Handed over: a new lead." : "Added to their existing lead.",
                      )
                    }
                  >
                    {busy === "handover" ? "Handing over..." : "Hand over to Leads"}
                  </button>
                )
              )}
              <button
                type="button"
                className={secondary}
                disabled={busy !== null}
                onClick={() => void run("handled", () => api<Loaded>(base, { handled: !reply.handledAt }, "PATCH"), reply.handledAt ? "Back in your list." : "Marked handled.")}
              >
                {reply.handledAt ? "Not handled yet" : "Mark handled"}
              </button>
            </div>
            {reply.handledAt && <p className="mt-3 text-xs text-[hsl(var(--color-foreground-subtle))]">Handled {formatWhen(reply.handledAt)}</p>}
          </DetailSection>

          <DetailSection title="Prospect">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/outreach/${p.campaignId}/${p.id}`} className="text-sm font-medium text-[hsl(var(--color-accent))] hover:underline">
                {p.company}
              </Link>
              <StatusPill status={p.status} />
            </div>
            <p className="mt-1 text-sm text-[hsl(var(--color-foreground-muted))]">{[p.segment, p.location].filter(Boolean).join(" · ")}</p>
            {/^https?:\/\//i.test(p.website) && (
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-[hsl(var(--color-accent))] hover:underline">
                {p.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <IconExternal size={12} />
              </a>
            )}
            {p.followUp && !p.followUp.sentAt && p.status === "sent" && (
              <p className="mt-2 text-xs text-[hsl(var(--color-foreground-subtle))]">
                {reply.label === "unclear" ? "Follow-up held until this is labelled." : `Follow-up due ${formatDay(p.followUp.dueAt)}.`}
              </p>
            )}
          </DetailSection>
        </div>
      </div>

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
              <IconAlertTriangle size={18} className="mt-px shrink-0 text-[hsl(var(--color-error))]" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p>{message.text}</p>
              {message.tone === "ok" && message.lead && (
                <Link href={`/admin/leads/${message.lead}`} className="block font-medium text-[hsl(var(--color-accent))] underline-offset-2 hover:underline">
                  Open the lead →
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

export default function OutreachReplyPage() {
  return (
    <React.Suspense fallback={<AdminLoader message="Loading reply..." />}>
      <ReplyPage />
    </React.Suspense>
  );
}
