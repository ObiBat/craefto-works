"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  type Variants,
  type MotionValue,
} from "framer-motion";

// ============================================================================
// REDUCED MOTION CONTEXT
// ============================================================================

const MotionContext = React.createContext<{ prefersReducedMotion: boolean }>({
  prefersReducedMotion: false,
});

export function useMotionPreference() {
  return React.useContext(MotionContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <MotionContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

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
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for scroll-triggered animations with reduced motion support
 */
export function useScrollAnimation(options?: {
  threshold?: number;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: "-80px",
    amount: options?.threshold ?? 0.1,
  });

  return { ref, isInView: prefersReducedMotion ? true : isInView };
}

/**
 * Hook for parallax scroll effects (disabled for reduced motion)
 */
export function useParallax(
  value: MotionValue<number>,
  distance: number
): MotionValue<number> {
  const prefersReducedMotion = useReducedMotion();
  const transform = useTransform(value, [0, 1], [-distance, distance]);
  const noTransform = useTransform(value, [0, 1], [0, 0]);
  return prefersReducedMotion ? noTransform : transform;
}

/**
 * Hook for smooth scroll progress
 */
export function useSmoothScroll() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return { scrollYProgress, smoothProgress };
}

/**
 * Hook for element scroll progress
 */
export function useElementScroll(offset?: ["start end" | "end start", "start end" | "end start"]) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset ?? ["start end", "end start"],
  });

  return { ref, scrollYProgress };
}

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
 * Animated text reveal (character by character)
 */
interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ text, className, delay = 0 }: TextRevealProps) {
  const words = text.split(" ");
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block mr-[0.25em]" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={smoothTransition}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Animated counter with accessibility
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
  const { ref, isInView } = useScrollAnimation();
  const [count, setCount] = React.useState(0);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Fallback: trigger animation after 1.5s if intersection observer hasn't fired
  React.useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setShouldAnimate(true);
    }, 1500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Trigger animation when in view OR fallback timer fires
  React.useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    }
  }, [isInView]);

  // Run the animation
  React.useEffect(() => {
    if (!shouldAnimate) return;

    if (prefersReducedMotion) {
      setCount(value);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [shouldAnimate, value, duration, prefersReducedMotion]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={`${prefix}${value}${suffix}`}
    >
      <span aria-hidden="true">{prefix}{count}{suffix}</span>
    </span>
  );
}

/**
 * Hover card with lift effect (desktop only, touch-friendly)
 */
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverCard({ children, className }: HoverCardProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98 }}
      style={{ transform: "translateZ(0)" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magnetic button effect (desktop only)
 */
interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function Magnetic({ children, className, strength = 0.3 }: MagneticProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isTouchDevice || prefersReducedMotion) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  if (isTouchDevice || prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      style={{ transform: "translateZ(0)" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smooth scroll link
 */
interface SmoothScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export function SmoothScrollLink({
  href,
  children,
  className,
  offset = 80
}: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        const top = element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
