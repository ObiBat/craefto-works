"use client";

import { useState, useEffect } from "react";
import { scrollPageTo } from "@/lib/smooth-scroll";

/**
 * Appears after two screens of scrolling. Always in the DOM; CSS fades and
 * lifts it in and out (see .back-to-top in globals.css), and while hidden it
 * is out of the tab order and the accessibility tree.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 2);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => scrollPageTo(0)}
      data-shown={visible ? "" : undefined}
      className="back-to-top fixed bottom-6 right-6 z-40 w-12 h-12 bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95"
      aria-label="Back to top"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}
