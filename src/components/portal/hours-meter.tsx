import { shortHours, type Usage } from "@/lib/portal/hours";
import { cn } from "@/lib/utils";

const range = (low: number, high: number) => (Math.abs(high - low) < 0.25 ? shortHours(high) : `${shortHours(low).replace(" h", "")}–${shortHours(high)}`);

const renewsLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "long", timeZone: "UTC" });

/**
 * The month's studio time at a glance: the hours left, and a bar of what's
 * used (ink), what's approved in the queue (sage, its estimate's range
 * lighter) and what's free. Over the allowance, the bar stretches and says so.
 */
export function HoursMeter({ usage, className }: { usage: Usage; className?: string }) {
  const { allowance, used, committedLow, committedHigh, month } = usage;
  if (!allowance) {
    return (
      <div className={cn("rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-7", className)}>
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">This month</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{shortHours(used)}</p>
        <p className="mt-1 text-sm text-[hsl(var(--color-foreground-muted))]">of studio time logged</p>
      </div>
    );
  }
  const total = Math.max(allowance.hours, used + committedHigh);
  const width = (hours: number) => `${Math.max(0, (hours / total) * 100)}%`;
  const left = allowance.hours - used;
  const afterQueue = allowance.hours - used - committedHigh;
  const over = left < 0;
  return (
    <section aria-label="Your hours this month" className={cn("rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-7", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">This month</p>
        <p className="truncate text-xs text-[hsl(var(--color-foreground-subtle))]">{allowance.label}</p>
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight tabular-nums">{shortHours(Math.abs(left)).replace(" h", "")}</span>
        <span className="text-[hsl(var(--color-foreground-muted))]">
          {over ? `hours over your ${allowance.hours}` : `of ${allowance.hours} hours left`}
        </span>
      </p>

      <div
        role="img"
        aria-label={`${shortHours(used)} used, ${range(committedLow, committedHigh)} approved in your queue, of ${allowance.hours} hours this month`}
        className="relative mt-5 h-3 overflow-hidden rounded-full bg-[hsl(var(--color-background-muted))]"
      >
        <div className="portal-meter-fill flex h-full">
          <span className="h-full bg-[hsl(var(--color-foreground))]" style={{ width: width(used) }} />
          <span className="h-full bg-[hsl(var(--color-accent))]" style={{ width: width(committedLow) }} />
          <span className="portal-meter-range h-full" style={{ width: width(committedHigh - committedLow) }} />
        </div>
        {total > allowance.hours && (
          <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-[hsl(var(--color-background))]" style={{ left: width(allowance.hours) }} />
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-[hsl(var(--color-foreground-subtle))]">
            <span aria-hidden="true" className="size-2 rounded-full bg-[hsl(var(--color-foreground))]" />
            Used
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums">{shortHours(used)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[hsl(var(--color-foreground-subtle))]">
            <span aria-hidden="true" className="size-2 rounded-full bg-[hsl(var(--color-accent))]" />
            In queue
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums">{committedHigh > 0 ? range(committedLow, committedHigh) : "None"}</dd>
        </div>
        <div>
          <dt className="text-[hsl(var(--color-foreground-subtle))]">Renews</dt>
          <dd className="mt-0.5 font-medium">{renewsLabel(month.renews)}</dd>
        </div>
      </dl>
      {afterQueue < 0 && !over && (
        <p className="mt-4 rounded-2xl bg-[hsl(var(--color-warning-subtle))] px-4 py-3 text-sm leading-relaxed">
          Your approved queue comes to more than this month&apos;s hours. Obi will carry what doesn&apos;t fit to next month.
        </p>
      )}
    </section>
  );
}
