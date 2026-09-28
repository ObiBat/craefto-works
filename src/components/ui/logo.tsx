"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
  inverted?: boolean;
}

const sizes = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 52, height: 52 },
  xl: { width: 72, height: 72 },
};

export function Logo({
  size = "md",
  className,
  animate = true,
  inverted = false
}: LogoProps) {
  const { width, height } = sizes[size];
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState({ x: 0, y: 0, rotateX: 0, rotateY: 0 });

  // Magnetic 3D tilt effect on hover
  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!animate || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center (normalized -1 to 1)
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    // Subtle magnetic pull + 3D rotation
    setTransform({
      x: x * 3,
      y: y * 2,
      rotateX: -y * 8,
      rotateY: x * 8,
    });
  }, [animate]);

  const handleMouseLeave = React.useCallback(() => {
    setTransform({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "logo-container inline-flex items-center justify-center",
        animate && "logo-magnetic",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: animate
          ? `translate(${transform.x}px, ${transform.y}px) perspective(500px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`
          : undefined,
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <LogoMark
        width={width}
        height={height}
        className={cn(
          "logo-svg transition-all duration-300",
          inverted ? "text-white" : "text-[hsl(var(--color-foreground))]"
        )}
      />
    </div>
  );
}

// Export a simple static version for cases where animation isn't needed
export function LogoStatic({
  size = "md",
  className,
  inverted = false
}: Omit<LogoProps, "animate">) {
  const { width, height } = sizes[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "transition-colors duration-300",
        inverted ? "text-white" : "text-[hsl(var(--color-foreground))]",
        className
      )}
      aria-hidden="true"
    >
      <g transform="translate(0,400) scale(0.1,-0.1)" fill="currentColor" fillRule="nonzero">
        <path d="M622 3258 l3 -123 150 -6 c83 -3 180 -13 216 -22 217 -53 381 -142 534 -288 177 -170 273 -339 329 -579 12 -52 20 -102 19 -110 -3 -11 -33 -20 -106 -32 -133 -22 -267 -67 -398 -135 -137 -70 -253 -158 -365 -275 -144 -151 -244 -317 -309 -511 -44 -133 -64 -250 -72 -421 l-6 -139 174 6 c151 4 189 9 289 35 211 55 387 145 555 284 133 111 259 268 334 416 l32 63 36 -68 c64 -121 135 -216 248 -329 167 -168 339 -273 557 -343 133 -42 259 -61 411 -61 l127 0 0 119 0 118 -137 6 c-201 8 -329 39 -492 119 -97 48 -215 133 -293 211 -100 100 -192 234 -242 354 -33 79 -72 213 -81 280 l-7 52 49 6 c100 13 262 58 365 102 207 86 424 257 564 442 79 105 185 315 219 436 37 127 55 261 55 399 l0 119 -152 -6 c-233 -10 -409 -53 -593 -148 -210 -107 -391 -267 -523 -461 -17 -25 -49 -78 -71 -118 l-38 -71 -41 73 c-127 230 -311 418 -537 547 -207 119 -451 181 -708 181 l-98 0 3 -122z m2504 -155 c-2 -10 -8 -38 -11 -63 -20 -128 -101 -316 -193 -445 -103 -145 -265 -282 -426 -360 -96 -47 -226 -88 -313 -100 -41 -5 -53 -4 -53 7 1 32 40 188 63 248 51 136 132 270 229 375 65 72 176 161 266 214 118 70 318 139 405 140 32 1 38 -2 33 -16z m-1281 -1388 c-32 -125 -114 -296 -194 -403 -110 -145 -257 -264 -424 -342 -87 -41 -220 -83 -301 -95 l-49 -7 8 59 c9 74 47 197 91 292 79 171 222 342 377 449 136 94 321 170 466 191 44 6 46 5 49 -19 1 -14 -9 -70 -23 -125z"/>
      </g>
    </svg>
  );
}
