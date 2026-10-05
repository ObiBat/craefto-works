import { cn } from "@/lib/utils";

// What the Leads list and a lead's page share.

export interface Stage {
  id: string;
  name: string;
  slug: string;
  /** A hex colour from pipeline_stages. */
  color: string | null;
}

export const when = (iso: string, withTime = false) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(iso));

/** A stage's colour as a small dot beside its name. */
export function StageDot({ color, className }: { color: string | null | undefined; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color ?? "#6B7280" }} />;
}

/** Moving a lead along the pipeline. */
export function StageSelect({ stages, value, onChange, label }: { stages: Stage[]; value: string | null; onChange: (stageId: string) => void; label: string }) {
  const current = stages.find((stage) => stage.id === value);
  return (
    <span className="relative inline-flex items-center">
      <StageDot color={current?.color} className="pointer-events-none absolute left-3" />
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] py-1.5 pl-7 pr-8 text-sm font-medium text-[hsl(var(--color-foreground))] transition-colors hover:border-[hsl(var(--color-border-strong))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40"
      >
        {!current && <option value="">No stage</option>}
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" className="pointer-events-none absolute right-3 size-3.5 text-[hsl(var(--color-foreground-subtle))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  );
}

/** Saves a lead's new stage; resolves to whether it saved. */
export async function saveStage(leadId: string, stageId: string) {
  const res = await fetch(`/api/admin/leads/${leadId}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stageId }),
  }).catch(() => null);
  return Boolean(res?.ok);
}
