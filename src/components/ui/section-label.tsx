import { cn } from "@/lib/utils";

interface SectionLabelProps {
  number?: string;
  label: string;
  className?: string;
}

export function SectionLabel({ number, label, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      {number && (
        <span className="font-mono text-xs font-medium text-[hsl(var(--color-accent))] tabular-nums">
          {number}
        </span>
      )}
      <span className="text-xs font-medium uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-subtle))]">
        {label}
      </span>
    </div>
  );
}
