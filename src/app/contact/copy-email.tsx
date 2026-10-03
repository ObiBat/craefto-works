"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { siteConfig } from "@/lib/constants";

/** The studio's address, with a one-click copy. */
export function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${siteConfig.email}`;
    }
  };
  return (
    <button type="button" onClick={copy} className="group flex w-full items-center justify-between gap-3 text-left" aria-label={`Copy ${siteConfig.email}`}>
      <span className="font-medium text-[hsl(var(--color-foreground))] transition-colors group-hover:text-[hsl(var(--color-accent))]">{siteConfig.email}</span>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          copied ? "bg-[hsl(var(--color-accent))] text-white" : "bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground-muted))]"
        }`}
        aria-live="polite"
      >
        {copied ? <Check size={12} weight="bold" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
