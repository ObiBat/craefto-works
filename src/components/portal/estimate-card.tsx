import { estimateLabel, type ClientRequest } from "@/lib/portal/types";
import { shortHours } from "@/lib/portal/hours";
import { cn } from "@/lib/utils";
import { ApproveEstimate, WithdrawRequest } from "./estimate-actions";
import { StatusPill } from "./status-pill";

const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * A request's estimate, as it goes from Ask Craefto's initial range to the
 * one Obi confirms, which the client approves before work starts; then the
 * time logged against it, so the effort going in is plain to see.
 */
export function EstimateCard({ request, loggedMinutes }: { request: ClientRequest; loggedMinutes: number }) {
  const label = estimateLabel(request);
  const notes = (request.estimate_note ?? "")
    .split(/;\s*|\n+/)
    .map((note) => note.trim())
    .filter(Boolean)
    .map((note) => note.charAt(0).toUpperCase() + note.slice(1));
  const closed = request.status === "delivered" || request.status === "withdrawn";
  const logged = loggedMinutes / 60;
  const high = request.estimate_high != null ? Number(request.estimate_high) : null;
  const waiting = request.status === "estimated" && request.estimate_state === "confirmed";
  const withdrawable = ["received", "estimated", "queued"].includes(request.status);

  const pill =
    request.estimate_state === "initial" ? (
      <StatusPill tone="quiet">Initial · Ask Craefto</StatusPill>
    ) : request.estimate_state === "confirmed" ? (
      <StatusPill tone="attention">Confirmed · waiting for you</StatusPill>
    ) : request.estimate_state === "approved" ? (
      <StatusPill tone="active">Approved</StatusPill>
    ) : null;

  return (
    <section
      aria-label="Estimate"
      className={cn("rounded-3xl p-6 md:p-8", waiting ? "bg-[hsl(var(--color-warning-subtle))]" : "bg-[hsl(var(--color-background-subtle))]")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">Estimate</p>
        {pill}
      </div>

      {label ? (
        <>
          <p className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight md:text-5xl">{label}</p>
          <p className="mt-1 text-[hsl(var(--color-foreground-muted))]">of studio time</p>
        </>
      ) : (
        <p className="mt-3 text-2xl font-semibold tracking-tight">{closed ? "No estimate" : "Estimate on its way"}</p>
      )}

      {notes.length > 0 && (
        <ul className="mt-5 flex flex-col gap-1.5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
          {notes.map((note) => (
            <li key={note} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent))]" />
              {note}
            </li>
          ))}
        </ul>
      )}

      {request.target_date && !closed && (request.estimate_state === "confirmed" || request.estimate_state === "approved") && (
        <p className="mt-5 text-sm text-[hsl(var(--color-foreground-muted))]">
          Craefto Works aims to deliver it by <span className="font-medium text-[hsl(var(--color-foreground))]">{dayLabel(request.target_date)}</span>
          {request.estimate_state === "confirmed" ? ", once you approve it." : "."}
        </p>
      )}

      {request.estimate_state === "initial" && !closed && (
        <p className="mt-5 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
          Ask Craefto&apos;s first read. Craefto Works checks it and confirms it, and you approve it here before any work starts.
        </p>
      )}
      {request.estimate_state === "none" && !closed && (
        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">
          Craefto Works adds one shortly, and you approve it before any work starts.
        </p>
      )}

      {(request.estimate_state === "approved" || logged > 0) && high != null && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-[hsl(var(--color-foreground-muted))]">Time logged</span>
            <span className="font-medium tabular-nums">
              {shortHours(logged)} <span className="font-normal text-[hsl(var(--color-foreground-subtle))]">of up to {shortHours(high)}</span>
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[hsl(var(--color-background-muted))]">
            <div
              className={cn("portal-meter-fill h-full rounded-full", logged > high ? "bg-[hsl(var(--color-warning))]" : "bg-[hsl(var(--color-accent))]")}
              style={{ width: `${Math.min(100, (logged / high) * 100)}%` }}
            />
          </div>
          {logged > high && (
            <p className="mt-2 text-sm text-[hsl(var(--color-foreground-muted))]">This has taken longer than estimated. Craefto Works will talk it through with you.</p>
          )}
        </div>
      )}

      {waiting && (
        <div className="mt-7">
          <ApproveEstimate requestId={request.id} />
          <p className="mt-3 text-sm text-[hsl(var(--color-foreground-muted))]">Nothing starts before you approve. Once you do, it joins your queue.</p>
        </div>
      )}
      {withdrawable && (
        <div className="mt-5">
          <WithdrawRequest requestId={request.id} />
        </div>
      )}
    </section>
  );
}
