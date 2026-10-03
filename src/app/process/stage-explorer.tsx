"use client";

import type { CSSProperties } from "react";
import { useQueryChoice } from "@/hooks/use-query-choice";
import { capabilities, type CapabilityId } from "@/content/capabilities";
import { shapes, stages } from "@/content/process";
import { cn } from "@/lib/utils";

type View = CapabilityId | "all";
const VIEWS: View[] = ["all", ...capabilities.map((capability) => capability.id)];
const muted = "text-[hsl(var(--color-foreground-muted))]";

/** A tick that fills in once its stage is lit (see .tick and .capability in globals.css). */
function Tick({ index }: { index: number }) {
  return (
    <span className="tick mt-0.5" style={{ "--i": index } as CSSProperties} aria-hidden="true">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

/**
 * The six stages, shown for all work or for one capability. The choice is
 * kept in the address (?for=media), so a link can open on a capability.
 */
export function StageExplorer() {
  const [view, choose] = useQueryChoice<View>("for", VIEWS, "all");

  const label = (id: View) => (id === "all" ? "All work" : capabilities.find((capability) => capability.id === id)!.name);
  const number = (id: View) => (id === "all" ? "01–05" : capabilities.find((capability) => capability.id === id)!.number);

  return (
    <>
      <div className="mt-12 flex flex-col gap-5">
        <div role="radiogroup" aria-label="Show the stages for" className="flex flex-wrap gap-2">
          {VIEWS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={view === id}
              onClick={() => choose(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                view === id
                  ? "bg-[hsl(var(--color-accent))] text-white"
                  : "bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground-muted))] hover:bg-[hsl(var(--color-accent-subtle))] hover:text-[hsl(var(--color-accent))]",
              )}
            >
              <span className={cn("font-mono text-xs tabular-nums", view === id ? "text-white/70" : "text-[hsl(var(--color-accent))]")}>{number(id)}</span>
              {label(id)}
            </button>
          ))}
        </div>
        <p className={`max-w-2xl text-lg leading-relaxed ${muted}`} aria-live="polite">
          {shapes[view]}
        </p>
      </div>

      <ol className="mt-16 flex flex-col gap-20 lg:mt-20 lg:gap-28">
        {stages.map((stage) => {
          const work = view === "all" ? null : stage.byCapability[view];
          return (
            <li key={stage.id} id={stage.id} className="phase capability grid scroll-mt-28 grid-cols-[3rem_minmax(0,1fr)] gap-x-5 lg:grid-cols-[4rem_minmax(0,1fr)] lg:gap-x-10">
              {/* The marker stays beside the stage while you read it, and fills in as the stage arrives. */}
              <div>
                <div className="sticky top-28">
                  <div className="phase-marker flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--color-accent))] text-white lg:h-16 lg:w-16">
                    <span className="font-heading text-xl font-bold tabular-nums lg:text-2xl">{stage.number}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">{stage.name}</h2>
                  <p className="text-xl leading-snug text-[hsl(var(--color-foreground))]">{stage.purpose}</p>
                </div>

                {work ? (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
                    <ul className="flex flex-col gap-3">
                      {work.activities.map((activity, index) => (
                        <li key={activity} className={`flex items-start gap-3 ${muted}`}>
                          <Tick index={index} />
                          <span className="leading-relaxed">{activity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="capability-price self-start rounded-2xl p-6">
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">You have</p>
                      <p className="mt-2 font-medium leading-relaxed text-[hsl(var(--color-foreground))]">{work.outcome}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
                    <p className={`max-w-2xl text-lg leading-relaxed ${muted}`}>{stage.general}</p>
                    <dl className="capability-price self-start rounded-2xl p-6">
                      <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.06em] text-[hsl(var(--color-accent))]">You have, by capability</p>
                      {capabilities.map((capability) => (
                        <div key={capability.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
                          <dt className="font-medium text-[hsl(var(--color-foreground))]">{capability.name}</dt>
                          <dd className={muted}>{stage.byCapability[capability.id].outcome}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
