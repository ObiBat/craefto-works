import Link from "next/link";
import { cn } from "@/lib/utils";

/** A titled group on a portal page; the title is a small mono label. */
export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="label-heading">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Something to know now: good news on a sage tint, anything that needs the client on a warm one. */
export function Callout({
  tone = "accent",
  title,
  children,
  action,
}: {
  tone?: "accent" | "attention";
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      role={tone === "attention" ? "status" : undefined}
      className={cn(
        "flex flex-col gap-5 rounded-3xl p-6 md:flex-row md:items-center md:justify-between md:p-8",
        tone === "accent" ? "bg-[hsl(var(--color-accent-subtle))]" : "bg-[hsl(var(--color-warning-subtle))]"
      )}
    >
      <div className="max-w-xl">
        <p className="text-lg font-semibold tracking-tight text-[hsl(var(--color-foreground))]">{title}</p>
        {children && <div className="mt-1.5 leading-relaxed text-[hsl(var(--color-foreground-muted))]">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--color-foreground-muted))] transition-colors hover:text-[hsl(var(--color-foreground))]"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  );
}

/** A soft panel with a short message, for empty lists. */
export function Empty({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-8">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {children && <div className="mt-1.5 max-w-xl leading-relaxed text-[hsl(var(--color-foreground-muted))]">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
