"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Glide } from "@/components/editorial/glide";

export interface FaqEntry {
  question: string;
  answer: string;
}

function FaqItem({ faq, index }: { faq: FaqEntry; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      data-glide-item
      className={cn(
        "-mx-2.5 sm:-mx-5 px-2.5 sm:px-5 rounded-2xl transition-colors duration-500",
        isOpen && "bg-[hsl(var(--color-accent-subtle))]"
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-5 py-5 text-left group"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span
          className={cn(
            "w-5 font-mono text-xs tabular-nums shrink-0 transition-colors duration-300 group-hover:text-[hsl(var(--color-accent))]",
            isOpen ? "text-[hsl(var(--color-accent))]" : "text-[hsl(var(--color-foreground-subtle))]"
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors pr-4">
          {faq.question}
        </span>
        <span
          data-open={isOpen ? "" : undefined}
          className={cn(
            "acc-toggle w-8 h-8 rounded-full flex items-center justify-center shrink-0 group-hover:bg-[hsl(var(--color-accent))] group-hover:text-white",
            isOpen
              ? "bg-[hsl(var(--color-accent))] text-white"
              : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))]"
          )}
          aria-hidden="true"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {/* Opened and closed by a CSS grid-row transition (.acc-panel); inert
          while closed, so it's out of the tab order and hidden from readers. */}
      <div id={panelId} data-open={isOpen ? "" : undefined} inert={!isOpen} className="acc-panel">
        <div className="overflow-hidden">
          <p data-no-reveal className="pl-10 pb-6 text-[hsl(var(--color-foreground-muted))] leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface FaqGroup {
  label: string;
  items: FaqEntry[];
}

/** Questions in labelled groups, numbered straight through. */
export function Faq({ groups }: { groups: FaqGroup[] }) {
  const offsets = groups.map((_, index) => groups.slice(0, index).reduce((total, group) => total + group.items.length, 0));
  return (
    <div className="flex flex-col gap-12">
      {groups.map((group, groupIndex) => (
        <div key={group.label}>
          <h3 className="label-heading mb-3">{group.label}</h3>
          <Glide bleed={0}>
            {group.items.map((faq, index) => (
              <FaqItem key={faq.question} faq={faq} index={offsets[groupIndex] + index} />
            ))}
          </Glide>
        </div>
      ))}
    </div>
  );
}
