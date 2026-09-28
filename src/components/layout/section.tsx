import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
}

function Section({ className, spacing = "lg", children, ...props }: SectionProps) {
  const spacingClasses = {
    // Generous, editorial rhythm: whitespace separates sections, not rules.
    xs: "py-12 md:py-16",
    sm: "py-16 md:py-24",
    md: "py-20 md:py-32",
    lg: "py-24 md:py-40",
    xl: "py-32 md:py-52",
  };

  return (
    <section className={cn(spacingClasses[spacing], className)} {...props}>
      {children}
    </section>
  );
}

export { Section };
