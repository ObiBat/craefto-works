"use client";

import { useEffect } from "react";

// Phones: no hover, and the plans stack in one column (below Tailwind's md).
const PHONE = "(hover: none) and (max-width: 767px)";

/**
 * Phones can't hover, so the plan card crossing the middle of the screen is
 * lit instead, the way a hovered card is on desktop. Its [data-spotlight]
 * turns it on in globals.css (see .plan-card).
 */
export function PlanSpotlight() {
  useEffect(() => {
    const phone = window.matchMedia(PHONE);
    const cards = [...document.querySelectorAll<HTMLElement>(".plan-card")];
    let observer: IntersectionObserver | null = null;

    const stop = () => {
      observer?.disconnect();
      observer = null;
      cards.forEach((card) => card.removeAttribute("data-spotlight"));
    };
    const start = () => {
      stop();
      if (!phone.matches) return;
      // A thin band across the middle of the screen.
      observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.target.toggleAttribute("data-spotlight", entry.isIntersecting)),
        { rootMargin: "-48% 0px -48% 0px" }
      );
      cards.forEach((card) => observer!.observe(card));
    };

    start();
    phone.addEventListener("change", start);
    return () => {
      phone.removeEventListener("change", start);
      stop();
    };
  }, []);

  return null;
}
