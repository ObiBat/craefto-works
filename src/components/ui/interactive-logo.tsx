"use client";

import { useState } from "react";

interface InteractiveLogoProps {
  className?: string;
}

/**
 * GlobFam's flower mark: hover (or touch) turns it half a turn and lifts it,
 * a tap spins it a full turn. CSS transitions do the motion (see .ilogo in
 * globals.css); React only tracks the state.
 */
export function InteractiveLogo({ className = "" }: InteractiveLogoProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [spins, setSpins] = useState(0);

  const handleHoverStart = () => {
    setIsHovered(true);
    setHasInteracted(true);
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  const handleTap = () => {
    setHasInteracted(true);
    setSpins((n) => n + 1);
    setIsPressed(true);
    window.setTimeout(() => setIsPressed(false), 250);
  };

  const turn = spins * 360 + (isHovered ? 180 : 0);
  const scale = isPressed ? 0.95 : isHovered ? 1.1 : 1;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: "#1A759F" }}
    >
      {/* Interactive Logo Container */}
      <div
        className="ilogo-mark relative cursor-pointer p-8 rounded-full"
        style={{ touchAction: "none", transform: `rotate(${turn}deg) scale(${scale})` }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onTouchStart={handleHoverStart}
        onTouchEnd={handleHoverEnd}
        onClick={handleTap}
      >
        {/* Hover background glow */}
        <div
          className="ilogo-glow absolute inset-0 rounded-full bg-white/10"
          style={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* GlobFam Flower Logo - White version */}
        <svg
          width="160"
          height="160"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-lg pointer-events-none"
        >
          <path d="M 12 12 C 10 9 10 5 12 2 C 14 5 14 9 12 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none"/>
          <path d="M 12 12 C 14 10 17.5 8.5 20.5 9.5 C 17.5 11.5 14.5 12 12 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none"/>
          <path d="M 12 12 C 14.5 12 17.5 12.5 20.5 14.5 C 17.5 15.5 14 14 12 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none"/>
          <path d="M 12 12 C 14 15 14 19 12 22 C 10 19 10 15 12 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none"/>
          <path d="M 12 12 C 9.5 12 6.5 12.5 3.5 14.5 C 6.5 15.5 10 14 12 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none"/>
          <path d="M 12 12 C 10 10 6.5 8.5 3.5 9.5 C 6.5 11.5 9.5 12 12 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* Interaction hint - fades out after first interaction */}
      <div
        className="ilogo-hint absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none"
        style={{ opacity: hasInteracted ? 0 : 1 }}
      >
        <span className="text-white/80 text-xs font-medium font-mono tracking-[0.06em] uppercase">
          Hover to interact
        </span>
        {/* Animated cursor icon */}
        <div className="ilogo-cursor">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-80"
          >
            <path
              d="M5 3l14 9-6 1 4 7-2 1-4-7-5 4V3z"
              fill="white"
              stroke="white"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Decorative ring */}
      <div className="ilogo-ring absolute w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
    </div>
  );
}
