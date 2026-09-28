import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  number?: string;
  label: string;
  className?: string;
}

// The label types itself in as it scrolls into view: a stepped wipe, one
// monospace character per step (see the editorial layer in globals.css).
export function SectionLabel({ number, label, className }: SectionLabelProps) {
  return (
    <div
      className={cn("flex items-center gap-3 mb-4", className)}
      data-reveal="type"
      data-section={label}
      data-section-number={number ?? ""}
      suppressHydrationWarning
    >
      {number && (
        <span className="type-num font-mono text-xs font-medium text-[hsl(var(--color-accent))] tabular-nums">
          {number}
        </span>
      )}
      <span
        className="type-in text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]"
        style={{ "--n": Array.from(label).length } as CSSProperties}
      >
        {label}
      </span>
    </div>
  );
}
