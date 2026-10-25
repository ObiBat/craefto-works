"use client";

import * as React from "react";
import { Card, StatusBadge } from "@/components/admin/ui";
import { IconExternal } from "@/components/admin/icons";
import type { MemberDetail } from "@/lib/portal/admin";
import {
  PAID_VIA,
  STANDINGS,
  formatMoney,
  invoiceDate,
  invoiceSummary,
  invoiceTotals,
  lineAmount,
  moneyInput,
  parseMoney,
  periodLabel,
  retainerMonth,
  standingOf,
  sydneyDay,
  type Standing,
} from "@/lib/portal/invoice-rules";
import type { ClientInvoice, ClientRequest } from "@/lib/portal/types";
import { cn } from "@/lib/utils";
import { api, field, primary, secondary, today } from "./controls";

// A client's billing in admin: who their invoices are made out to and the fee
// each month's is drafted at, then their invoices. A draft is edited here and
// is Craefto's alone; issuing numbers it, shows it in their portal and emails
// it with its PDF. Payments by bank transfer are marked here; card payments
// mark themselves (the Stripe webhook).

const VARIANT: Record<Standing, "neutral" | "accent" | "warning" | "success" | "error"> = {
  draft: "neutral",
  due: "accent",
  overdue: "error",
  paid: "success",
  void: "neutral",
};

const label = "flex flex-col gap-1 text-xs text-[hsl(var(--color-foreground-muted))]";
const quiet = "text-sm text-[hsl(var(--color-foreground-muted))]";
const pdfHref = (invoice: ClientInvoice) => `/api/admin/members/${invoice.account_id}/invoices/${invoice.id}/pdf`;

/** Who invoices go to, and the monthly fee. */
function BillingDetails({ member, onSaved }: { member: MemberDetail; onSaved: () => void }) {
  const { account } = member;
  const [name, setName] = React.useState(account.billing_name ?? "");
  const [address, setAddress] = React.useState(account.billing_address ?? "");
  const [email, setEmail] = React.useState(account.billing_email ?? "");
  const [fee, setFee] = React.useState(account.monthly_fee != null ? moneyInput(account.monthly_fee) : "");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api(`/api/admin/members/${account.id}`, "PATCH", { billing_name: name, billing_address: address, billing_email: email, monthly_fee: fee });
      setMessage("Saved. New drafts use these; issued invoices keep what they said.");
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSaving(false);
  }

  return (
    <Card>
      <form onSubmit={save} className="space-y-3">
        <p className="text-sm font-semibold">Billing details</p>
        <div className="grid gap-3">
          <label className={label}>
            Bill to
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} placeholder={account.company || account.name || "Business name"} className={cn(field, "py-1.5 text-sm")} />
          </label>
          <label className={label}>
            Invoices email (empty: theirs)
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={account.email} className={cn(field, "py-1.5 text-sm")} />
          </label>
          <label className={label}>
            Address, a line each
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} maxLength={500} placeholder={"Attn: Accounts\nSydney NSW\nAustralia"} className={cn(field, "text-sm")} />
          </label>
          <label className={label}>
            Monthly fee, AUD before GST (empty: none)
            <input inputMode="decimal" value={fee} onChange={(event) => setFee(event.target.value)} placeholder="3000" className={cn(field, "py-1.5 text-sm")} />
            <span className="leading-relaxed text-[hsl(var(--color-foreground-subtle))]">
              Drafts each month&apos;s invoice, billed in advance from day {account.cycle_day ?? 1} (their month under Hours).
            </span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className={primary}>
            {saving ? "Saving…" : "Save"}
          </button>
          {message && <span className={quiet}>{message}</span>}
        </div>
      </form>
    </Card>
  );
}

interface Line {
  description: string;
  detail: string;
  quantity: string;
  unit: string;
}

const linesOf = (invoice: ClientInvoice): Line[] =>
  invoice.items.map((item) => ({ description: item.description, detail: item.detail, quantity: String(item.quantity), unit: item.unit_amount ? moneyInput(item.unit_amount) : "" }));

/** Requests delivered in a window of days (Sydney), as an invoice would list them. */
const deliveredIn = (requests: ClientRequest[], start: string, end: string) =>
  requests.filter((request) => request.status === "delivered" && request.delivered_at && sydneyDay(request.delivered_at) >= start && sydneyDay(request.delivered_at) <= end).length;

/** A draft, edited: who it's to, its dates and period, its lines, notes and the delivered work it lists; then issued. */
function DraftEditor({ member, invoice, onSaved, onNotice, onDeleted }: { member: MemberDetail; invoice: ClientInvoice; onSaved: () => void; onNotice: (text: string | null) => void; onDeleted: () => void }) {
  const { account } = member;
  const [billToName, setBillToName] = React.useState(invoice.bill_to_name);
  const [billToAddress, setBillToAddress] = React.useState(invoice.bill_to_address);
  const [billToEmail, setBillToEmail] = React.useState(invoice.bill_to_email);
  const [issueDate, setIssueDate] = React.useState(invoice.issue_date);
  const [dueDate, setDueDate] = React.useState(invoice.due_date);
  const [periodStart, setPeriodStart] = React.useState(invoice.period_start ?? "");
  const [periodEnd, setPeriodEnd] = React.useState(invoice.period_end ?? "");
  const [lines, setLines] = React.useState<Line[]>(linesOf(invoice));
  const [notes, setNotes] = React.useState(invoice.notes);
  const [listWork, setListWork] = React.useState(Boolean(invoice.work_start));
  const [workStart, setWorkStart] = React.useState(invoice.work_start ?? "");
  const [workEnd, setWorkEnd] = React.useState(invoice.work_end ?? "");
  const [issuing, setIssuing] = React.useState(false);
  const [emailIt, setEmailIt] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [previewTo, setPreviewTo] = React.useState(member.billing.inbox);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const parsed = lines.map((line) => ({ quantity: Number(line.quantity) || 0, unit_amount: parseMoney(line.unit) ?? 0 }));
  const totals = invoiceTotals(parsed, member.billing.gst);
  const recipients = [...new Set([billToEmail.trim().toLowerCase(), account.email])].filter(Boolean);
  const workCount = listWork && workStart && workEnd ? deliveredIn(member.requests, workStart, workEnd) : 0;
  const setLine = (index: number, change: Partial<Line>) => setLines((current) => current.map((line, at) => (at === index ? { ...line, ...change } : line)));

  const body = () => ({
    bill_to_name: billToName,
    bill_to_address: billToAddress,
    bill_to_email: billToEmail,
    issue_date: issueDate,
    due_date: dueDate,
    period_start: periodStart || null,
    period_end: periodEnd || null,
    items: lines.map((line) => ({ description: line.description, detail: line.detail, quantity: Number(line.quantity), unit_amount: line.unit })),
    notes,
    work_start: listWork ? workStart || null : null,
    work_end: listWork ? workEnd || null : null,
  });
  const url = `/api/admin/members/${account.id}/invoices/${invoice.id}`;

  async function run(step: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    onNotice(null);
    try {
      const done = await step();
      if (done) onNotice(done);
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(false);
  }

  const save = () =>
    run(async () => {
      await api(url, "PATCH", body());
      onSaved();
      return "Draft saved. Only you can see it.";
    });

  const preview = () => {
    // Opened now, while the click still counts as the user's (a window opened after the save would be blocked).
    const opened = window.open("about:blank", "_blank");
    return run(async () => {
      try {
        await api(url, "PATCH", body());
      } catch (error) {
        opened?.close();
        throw error;
      }
      if (opened) opened.location.href = `${pdfHref(invoice)}?at=${Date.now()}`;
      onSaved();
      return null;
    });
  };

  const issue = () =>
    run(async () => {
      await api(url, "PATCH", body());
      const result = await api(url, "PATCH", { action: "issue", email: emailIt, message: note });
      onSaved();
      const number = result.invoice.number as string;
      if (!emailIt) return `Issued ${number}. It's in their portal; nothing was emailed.`;
      return result.emailed ? `Issued ${number} and emailed it to ${recipients.join(" and ")}.` : `Issued ${number}, but the email didn't go. Try "Email it" below.`;
    });

  const sendPreview = () =>
    run(async () => {
      await api(url, "PATCH", body());
      const result = await api(url, "PATCH", { action: "preview", message: note, to: previewTo });
      onSaved();
      return result.emailed ? `A preview is in ${result.to}. Nothing went to them, and it's still a draft.` : "The preview didn't go. Try again in a moment.";
    });

  const remove = () =>
    run(async () => {
      if (!window.confirm("Delete this draft? It was never sent.")) return null;
      await api(url, "DELETE");
      onDeleted();
      return null;
    });

  return (
    <div className="space-y-4 border-t border-[hsl(var(--color-border))]/60 pt-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className={label}>
          Bill to
          <input value={billToName} onChange={(event) => setBillToName(event.target.value)} maxLength={200} className={cn(field, "py-1.5 text-sm")} />
        </label>
        <label className={label}>
          Address, a line each
          <textarea value={billToAddress} onChange={(event) => setBillToAddress(event.target.value)} rows={2} maxLength={500} className={cn(field, "text-sm")} />
        </label>
        <label className={label}>
          Sent to
          <input type="email" value={billToEmail} onChange={(event) => setBillToEmail(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <label className={label}>
          Issue date (issuing makes it today)
          <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
        </label>
        <label className={label}>
          Due date
          <input type="date" value={dueDate} min={issueDate} onChange={(event) => setDueDate(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
        </label>
        <label className={label}>
          Period from (a retainer&apos;s month)
          <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
        </label>
        <label className={label}>
          Period to
          <input type="date" value={periodEnd} min={periodStart || undefined} onChange={(event) => setPeriodEnd(event.target.value)} className={cn(field, "py-1.5 text-sm")} />
        </label>
      </div>

      <div className="space-y-3">
        {lines.map((line, index) => (
          <div key={index} className="space-y-2 rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_8rem_auto] sm:items-end">
              <label className={label}>
                Line {index + 1}
                <input value={line.description} onChange={(event) => setLine(index, { description: event.target.value })} maxLength={200} placeholder="What it's for" className={cn(field, "py-1.5 text-sm")} />
              </label>
              <label className={label}>
                Qty
                <input inputMode="decimal" value={line.quantity} onChange={(event) => setLine(index, { quantity: event.target.value })} className={cn(field, "py-1.5 text-sm")} />
              </label>
              <label className={label}>
                Unit price ($)
                <input inputMode="decimal" value={line.unit} onChange={(event) => setLine(index, { unit: event.target.value })} placeholder="3000" className={cn(field, "py-1.5 text-sm")} />
              </label>
              <div className="flex items-center gap-3 pb-1.5 sm:justify-end">
                <span className="text-sm font-medium tabular-nums">{formatMoney(lineAmount(parsed[index]))}</span>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines((current) => current.filter((_, at) => at !== index))} className="text-xs text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-error))]">
                    Remove
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={line.detail}
              onChange={(event) => setLine(index, { detail: event.target.value })}
              rows={Math.min(10, Math.max(2, line.detail.split("\n").length))}
              maxLength={2000}
              placeholder={"More about it, a line each. Lines starting “- ” print as a list:\n- Homepage film\n- Katitas import"}
              aria-label={`Line ${index + 1} detail`}
              className={cn(field, "text-sm")}
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setLines((current) => [...current, { description: "", detail: "", quantity: "1", unit: "" }])} className={secondary}>
            Add a line
          </button>
          <p className="text-sm tabular-nums">
            <span className="text-[hsl(var(--color-foreground-muted))]">
              Subtotal {formatMoney(totals.subtotal)} · GST {formatMoney(totals.gst)} ·{" "}
            </span>
            <span className="font-semibold">Total {formatMoney(totals.total)}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={label}>
          Notes on the invoice (the payment reference and GST line are added for you)
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={2000} placeholder="Out-of-scope work is quoted separately." className={cn(field, "text-sm")} />
        </label>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            <input type="checkbox" checked={listWork} onChange={(event) => setListWork(event.target.checked)} className="mt-0.5 size-4 accent-[hsl(var(--color-accent))]" />
            <span>List the work delivered in a window, on its own page: a record, not a charge.</span>
          </label>
          {listWork && (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={workStart} onChange={(event) => setWorkStart(event.target.value)} aria-label="Delivered from" className={cn(field, "w-40 py-1.5 text-sm")} />
              <span className={quiet}>to</span>
              <input type="date" value={workEnd} min={workStart || undefined} onChange={(event) => setWorkEnd(event.target.value)} aria-label="Delivered to" className={cn(field, "w-40 py-1.5 text-sm")} />
              <span className={quiet}>{workStart && workEnd ? `${workCount} delivered` : ""}</span>
            </div>
          )}
        </div>
      </div>

      {issuing ? (
        <div className="space-y-3 rounded-xl bg-[hsl(var(--color-accent-subtle))]/60 p-4">
          <p className="text-sm font-semibold">Issue it</p>
          <p className={quiet}>It gets the next number, is dated today, and shows in their portal straight away. Issued invoices don&apos;t change: void one to replace it.</p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={emailIt} onChange={(event) => setEmailIt(event.target.checked)} className="mt-0.5 size-4 accent-[hsl(var(--color-accent))]" />
            <span>Email it with its PDF to {recipients.join(" and ")}</span>
          </label>
          {emailIt && (
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} placeholder="A note above the invoice in the email (optional)" aria-label="Note in the email" className={cn(field, "text-sm")} />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy || member.billing.missing.length > 0} onClick={issue} className={primary}>
              {busy ? "Issuing…" : emailIt ? "Issue and email" : "Issue"}
            </button>
            {emailIt && (
              <span className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={busy || member.billing.missing.length > 0 || !previewTo.trim()} onClick={sendPreview} className={secondary}>
                  Send me a preview
                </button>
                <span className={quiet}>at</span>
                <input type="email" value={previewTo} onChange={(event) => setPreviewTo(event.target.value)} aria-label="Send the preview to" className={cn(field, "w-56 py-1.5 text-sm")} />
              </span>
            )}
            <button type="button" onClick={() => setIssuing(false)} className={quiet}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} onClick={save} className={secondary}>
            Save draft
          </button>
          <button type="button" disabled={busy} onClick={preview} className={secondary}>
            Preview PDF
          </button>
          <button type="button" disabled={busy || member.billing.missing.length > 0} onClick={() => setIssuing(true)} className={primary}>
            Issue…
          </button>
          <button type="button" disabled={busy} onClick={remove} className="text-sm text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-error))]">
            Delete draft
          </button>
        </div>
      )}
      {error && <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>}
    </div>
  );
}

/** An issued invoice's actions: email it (again), mark it paid or undo that, void it. */
function IssuedActions({ member, invoice, onSaved, onNotice }: { member: MemberDetail; invoice: ClientInvoice; onSaved: () => void; onNotice: (text: string | null) => void }) {
  const { account } = member;
  const [mode, setMode] = React.useState<"none" | "paid" | "send">("none");
  const [paidOn, setPaidOn] = React.useState(today());
  const [via, setVia] = React.useState<"bank_transfer" | "other">("bank_transfer");
  const [reference, setReference] = React.useState("");
  const [receipt, setReceipt] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const url = `/api/admin/members/${account.id}/invoices/${invoice.id}`;

  async function run(step: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    onNotice(null);
    try {
      const done = await step();
      if (done) onNotice(done);
      setMode("none");
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(false);
  }

  const paid = () =>
    run(async () => {
      const result = await api(url, "PATCH", { action: "paid", paid_on: paidOn, via, reference, receipt });
      onSaved();
      return receipt ? (result.emailed ? "Marked paid, and they've been sent a receipt." : "Marked paid. The receipt didn't send.") : "Marked paid.";
    });
  const send = () =>
    run(async () => {
      const result = await api(url, "PATCH", { action: "send", message: note });
      onSaved();
      return result.emailed ? `Emailed to ${[...new Set([invoice.bill_to_email, account.email])].join(" and ")}.` : "The email didn't go. Try again in a moment.";
    });
  const unpaid = () =>
    run(async () => {
      if (!window.confirm("Mark it unpaid again? Its receipt, if one went, isn't recalled.")) return null;
      await api(url, "PATCH", { action: "unpaid" });
      onSaved();
      return "It's waiting for payment again.";
    });
  const voidIt = () =>
    run(async () => {
      if (!window.confirm(`Void ${invoice.number}? It keeps its number, shows as void in their portal and can't be paid. Nothing is emailed.`)) return null;
      await api(url, "PATCH", { action: "void" });
      onSaved();
      return "Voided.";
    });

  return (
    <div className="space-y-3 border-t border-[hsl(var(--color-border))]/60 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <a href={pdfHref(invoice)} target="_blank" rel="noopener noreferrer" className={cn(secondary, "inline-flex items-center gap-1.5")}>
          PDF <IconExternal size={12} />
        </a>
        <a href={`/api/admin/members/${account.id}/view?invoice=${invoice.id}`} target="_blank" rel="noopener noreferrer" className={cn(secondary, "inline-flex items-center gap-1.5")}>
          As they see it <IconExternal size={12} />
        </a>
        {invoice.status === "issued" && (
          <>
            <button type="button" disabled={busy} onClick={() => setMode(mode === "send" ? "none" : "send")} className={secondary}>
              {invoice.sent_at ? "Email it again" : "Email it"}
            </button>
            <button type="button" disabled={busy} onClick={() => setMode(mode === "paid" ? "none" : "paid")} className={primary}>
              Mark paid
            </button>
            <button type="button" disabled={busy} onClick={voidIt} className="text-sm text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-error))]">
              Void
            </button>
          </>
        )}
        {invoice.status === "paid" && invoice.paid_via !== "card" && (
          <button type="button" disabled={busy} onClick={unpaid} className="text-sm text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-error))]">
            Undo payment
          </button>
        )}
      </div>
      {mode === "paid" && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-3">
          <label className={label}>
            Arrived on
            <input type="date" value={paidOn} max={today()} onChange={(event) => setPaidOn(event.target.value)} className={cn(field, "w-40 py-1.5 text-sm")} />
          </label>
          <label className={label}>
            By
            <select value={via} onChange={(event) => setVia(event.target.value as "bank_transfer" | "other")} className={cn(field, "w-auto py-1.5 text-sm")}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className={cn(label, "min-w-[12rem] flex-1")}>
            Bank reference (optional)
            <input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={200} className={cn(field, "py-1.5 text-sm")} />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            <input type="checkbox" checked={receipt} onChange={(event) => setReceipt(event.target.checked)} className="size-4 accent-[hsl(var(--color-accent))]" />
            Email a receipt
          </label>
          <button type="button" disabled={busy} onClick={paid} className={primary}>
            {busy ? "Saving…" : "Mark paid"}
          </button>
        </div>
      )}
      {mode === "send" && (
        <div className="space-y-2 rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-3">
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={2000} placeholder="A note above the invoice (optional): a reminder, say" aria-label="Note in the email" className={cn(field, "text-sm")} />
          <button type="button" disabled={busy} onClick={send} className={primary}>
            {busy ? "Sending…" : `Email ${invoice.number} with its PDF`}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-[hsl(var(--color-error))]">{error}</p>}
    </div>
  );
}

function InvoiceCard({
  member,
  invoice,
  open,
  onToggle,
  onSaved,
  onDeleted,
}: {
  member: MemberDetail;
  invoice: ClientInvoice;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  // What the last step did ("Issued INV-2026-011 and emailed it…"): kept here, as the panel under it changes.
  const [notice, setNotice] = React.useState<string | null>(null);
  const standing = standingOf(invoice, today());
  const dates =
    invoice.status === "paid" && invoice.paid_at
      ? `Paid ${invoiceDate(sydneyDay(invoice.paid_at), true)}${invoice.paid_via ? ` · ${PAID_VIA[invoice.paid_via]}` : ""}${invoice.payment_reference ? ` · ${invoice.payment_reference}` : ""}`
      : invoice.status === "draft"
        ? `Draft · due ${invoiceDate(invoice.due_date, true)}`
        : `Issued ${invoiceDate(invoice.issue_date, true)} · due ${invoiceDate(invoice.due_date, true)}${invoice.sent_at ? " · emailed" : " · not emailed"}`;
  return (
    <Card padding="compact" className={cn((open || notice) && "space-y-4")}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block font-semibold">
            <span className="font-mono">{invoice.number ?? "Draft"}</span> <span className="font-normal text-[hsl(var(--color-foreground-muted))]">· {invoiceSummary(invoice)}</span>
          </span>
          <span className="mt-0.5 block text-xs text-[hsl(var(--color-foreground-subtle))]">{dates}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-semibold tabular-nums">{formatMoney(invoice.total)}</span>
          <StatusBadge variant={VARIANT[standing]}>{STANDINGS[standing].label}</StatusBadge>
        </span>
      </button>
      {notice && <p className="text-sm text-[hsl(var(--color-accent))]">{notice}</p>}
      {open &&
        (invoice.status === "draft" ? (
          <DraftEditor member={member} invoice={invoice} onSaved={onSaved} onNotice={setNotice} onDeleted={onDeleted} />
        ) : (
          <IssuedActions member={member} invoice={invoice} onSaved={onSaved} onNotice={setNotice} />
        ))}
    </Card>
  );
}

/** Their billing details and invoices, under Billing on the member page. */
export function BillingSection({ member, onSaved }: { member: MemberDetail; onSaved: () => void }) {
  const { account, invoices, billing } = member;
  const [openId, setOpenId] = React.useState<string | null>(() => invoices.find((invoice) => invoice.status === "draft")?.id ?? null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const month = retainerMonth(today(), account.cycle_day ?? 1);
  const monthTaken = invoices.some((invoice) => invoice.status !== "void" && invoice.period_start === month.start);

  async function draft(kind: "retainer" | "blank") {
    setBusy(true);
    setMessage(null);
    try {
      const invoice = await api(`/api/admin/members/${account.id}/invoices`, "POST", { kind });
      setOpenId(invoice.id);
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {billing.missing.length > 0 && (
        <p className="rounded-xl bg-[hsl(var(--color-warning-subtle))] px-4 py-3 text-sm text-[hsl(35_55%_30%)]">
          Before an invoice can be issued, set {billing.missing.join(", ")} in Vercel (Settings, Environment Variables), then redeploy. Drafts work meanwhile.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {account.monthly_fee != null && !monthTaken && (
              <button type="button" disabled={busy} onClick={() => draft("retainer")} className={primary}>
                Draft {periodLabel(month.start, month.end, true)} · {formatMoney(account.monthly_fee)}
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => draft("blank")} className={secondary}>
              New invoice
            </button>
            {message && <span className={quiet}>{message}</span>}
          </div>
          {invoices.length === 0 ? (
            <p className={quiet}>No invoices yet.{account.monthly_fee == null ? " Set their monthly fee to draft a month's invoice in one step." : ""}</p>
          ) : (
            invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                member={member}
                invoice={invoice}
                open={openId === invoice.id}
                onToggle={() => setOpenId(openId === invoice.id ? null : invoice.id)}
                onSaved={onSaved}
                onDeleted={() => {
                  setMessage("Draft deleted.");
                  onSaved();
                }}
              />
            ))
          )}
          {!billing.card && <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">Card payments are off: Stripe isn&apos;t set up here, so invoices are paid by bank transfer.</p>}
        </div>
        <BillingDetails key={account.id} member={member} onSaved={onSaved} />
      </div>
    </div>
  );
}
