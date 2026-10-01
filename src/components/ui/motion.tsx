import * as React from "react";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Motion for the public site is CSS-driven (see the editorial layer in
// globals.css), so nothing here needs framer-motion at runtime. The variant
// and transition presets below are plain objects kept for the admin
// screens, which animate with framer-motion themselves.

// ============================================================================
// ANIMATION VARIANTS (GPU-optimized with transform3d)
// ============================================================================

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, willChange: "opacity, transform" },
  visible: { opacity: 1, y: 0, willChange: "auto" },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -24, willChange: "opacity, transform" },
  visible: { opacity: 1, y: 0, willChange: "auto" },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0, willChange: "opacity" },
  visible: { opacity: 1, willChange: "auto" },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 24, willChange: "opacity, transform" },
  visible: { opacity: 1, x: 0, willChange: "auto" },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -24, willChange: "opacity, transform" },
  visible: { opacity: 1, x: 0, willChange: "auto" },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95, willChange: "opacity, transform" },
  visible: { opacity: 1, scale: 1, willChange: "auto" },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, willChange: "opacity, transform" },
  visible: { opacity: 1, y: 0, willChange: "auto" },
};

// Reduced motion variants (instant, no movement)
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================================================
// TRANSITIONS (optimized for 60fps)
// ============================================================================

export const defaultTransition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const smoothTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const pageTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

// Reduced motion transition
export const instantTransition = {
  duration: 0.01,
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Page wrapper. Page-to-page motion is handled by the browser's View
 * Transitions (see RouteTransitions), so this no longer fades the page in:
 * a server-rendered page must be visible without waiting for JavaScript.
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={className}>{children}</div>;
}

/**
 * Section that rises into view when scrolled to. Driven by CSS and the boot
 * script's IntersectionObserver (see the editorial layer in globals.css), so
 * it starts before hydration and content stays visible without JavaScript.
 */
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "scaleIn";
  id?: string;
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
  id,
}: AnimatedSectionProps) {
  return (
    <div
      id={id}
      data-reveal="block"
      data-variant={variant}
      className={className}
      style={{ "--d": Math.round(delay * 1000) } as React.CSSProperties}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

/**
 * Grid whose items rise in one after another when scrolled to (CSS-driven,
 * like AnimatedSection). Items are its direct <StaggeredItem> children.
 */
interface StaggeredGridProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredGrid({
  children,
  className,
  staggerDelay = 0.12,
}: StaggeredGridProps) {
  return (
    <div
      data-reveal="stagger"
      className={className}
      style={{ "--stagger": `${Math.round(staggerDelay * 1000)}ms` } as React.CSSProperties}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

/**
 * Staggered item (direct child of StaggeredGrid)
 */
interface StaggeredItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggeredItem({ children, className }: StaggeredItemProps) {
  return <div className={className ? `stagger-item ${className}` : "stagger-item"}>{children}</div>;
}

/**
 * Hero text with an entrance animation. Pure CSS, so it plays from the first
 * paint instead of after hydration (hero copy is often the largest paint).
 */
interface HeroTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function HeroText({ children, delay = 0, className }: HeroTextProps) {
  return (
    <div
      className={className ? `hero-in ${className}` : "hero-in"}
      style={{ "--hero-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * A number that counts up from zero when it scrolls into view. Pure CSS: the
 * boot script marks it [data-in], and a registered custom property animates
 * the digits (see "Counters" in globals.css). The real value is in the HTML,
 * so it reads correctly without JavaScript, with reduced motion and to screen
 * readers, and its width is reserved up front so nothing shifts as it counts.
 */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  className,
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  return (
    <span
      data-reveal="count"
      className={cn("count-up", className)}
      style={{ "--to": value, "--count-dur": `${duration}s` } as React.CSSProperties}
      suppressHydrationWarning
    >
      <span className="sr-only">{`${prefix}${value}${suffix}`}</span>
      <span aria-hidden="true">
        {prefix}
        {/* The boot script sets data-n here while it counts. */}
        <span className="count-up-num" suppressHydrationWarning>
          <span className="count-up-value">{value}</span>
        </span>
        {suffix}
      </span>
    </span>
  );
}
