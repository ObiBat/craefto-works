import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.04em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))]",
        secondary:
          "bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border-strong))]",
        accent:
          "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]",
        sage:
          "bg-[hsl(var(--color-secondary-subtle))] text-[hsl(var(--color-secondary))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
