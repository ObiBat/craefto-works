"use client";

import * as React from "react";

/** A value to type into a banking app (BSB, account, reference), with a button that copies it. */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-medium tabular-nums text-[hsl(var(--color-foreground))]">{value}</span>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={() => {
          // Spaces in "082 356" are for reading; banking apps want the digits.
          void navigator.clipboard?.writeText(/^[\d\s]+$/.test(value) ? value.replace(/\s/g, "") : value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        // A tap area beyond the word (the site's touch-target height would stretch the row).
        className="-my-2.5 min-h-0 py-2.5 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.06em] text-[hsl(var(--color-accent))] hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
