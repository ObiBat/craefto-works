import { cn } from "@/lib/utils";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/portal/types";

export type Tone = "quiet" | "active" | "attention" | "done";

const TONES: Record<Tone, string> = {
  quiet: "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]",
  active: "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]",
  attention: "bg-[hsl(var(--color-warning-subtle))] text-[hsl(35_55%_28%)]",
  done: "bg-[hsl(var(--color-accent))] text-white",
};

/** A small status label in the site's mono type. */
export function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[0.6875rem] font-medium uppercase leading-none tracking-[0.06em]",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function RequestStatusPill({ status }: { status: RequestStatus }) {
  const { label, tone } = REQUEST_STATUSES[status];
  return <StatusPill tone={tone}>{label}</StatusPill>;
}
