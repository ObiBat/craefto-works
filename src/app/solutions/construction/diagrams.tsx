import type { ReactNode } from "react";
import type { WorkflowStep } from "@/content/construction";
import { cn } from "@/lib/utils";

// The construction page's two diagrams, drawn in type and hairlines rather
// than pictures: how an AI suggestion reaches a crew, and how scheduling and
// timesheet data move through a connected system. Both are illustrations of
// what we'd build with a client, not screens from a product.

function Check({ className }: { className?: string }) {
  return (
    <svg className={cn("h-3 w-3 shrink-0", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** A step-off pill: who signs a step off before it goes further. */
function Approval({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--color-accent))] px-2.5 py-1 text-xs font-medium text-white">
      <Check />
      {children}
    </span>
  );
}

const mono = "font-mono text-[0.6875rem] uppercase tracking-[0.06em]";

/** One card in the hero's chain, joined to the one above by a short rule. */
function ChainStep({ label, children, accent = false }: { label: string; children: ReactNode; accent?: boolean }) {
  return (
    <li
      className={cn(
        "relative mt-6 rounded-2xl p-4 first:mt-0 sm:p-5",
        "before:absolute before:-top-6 before:left-7 before:h-6 before:w-px before:bg-[hsl(var(--color-accent)/0.35)] first:before:content-none",
        accent ? "bg-[hsl(var(--color-accent-subtle))]" : "bg-[hsl(var(--color-background))]",
      )}
    >
      <p className={cn(mono, accent ? "text-[hsl(var(--color-accent))]" : "text-[hsl(var(--color-foreground-subtle))]")}>{label}</p>
      <div className="mt-2 text-[0.9375rem] leading-relaxed text-[hsl(var(--color-foreground))]">{children}</div>
    </li>
  );
}

/** The hero's illustration: an AI suggestion, a supervisor's approval, then the crew's message in both languages. */
export function ApprovalChain() {
  return (
    <figure className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-3 sm:p-4">
      <ol aria-label="How a suggestion reaches the crew">
        <ChainStep label="AI suggestion">
          <p>Move two fixers from Site B to Site A for Thursday’s pour.</p>
        </ChainStep>
        <ChainStep label="Supervisor" accent>
          <p className="flex flex-wrap items-center justify-between gap-3">
            Checked against the plan
            <Approval>Approved</Approval>
          </p>
        </ChainStep>
        <ChainStep label="Crew message">
          <p>Thursday: Site A, start 6:00am.</p>
          <p lang="mn" className="mt-1 text-[hsl(var(--color-foreground-muted))]">
            Пүрэв гараг: А талбай, 6:00 цагт эхэлнэ.
          </p>
        </ChainStep>
      </ol>
      <figcaption className="px-2 pb-1 pt-4 text-xs leading-relaxed text-[hsl(var(--color-foreground-muted))]">
        An illustration. Nothing reaches a crew until a person approves it.
      </figcaption>
    </figure>
  );
}

/**
 * How scheduling and timesheet data move: six steps on a track, down the page
 * on phones and across it on wide screens, with the approval points marked.
 */
export function Workflow({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="grid grid-cols-1 gap-8 lg:grid-cols-6 lg:gap-5">
      {steps.map((step, index) => (
        <li key={step.title} className="relative pl-14 lg:pl-0 lg:pt-14">
          {/* The track to the next step: down on phones, across on wide screens. */}
          {index < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute -bottom-8 left-[19.5px] top-10 w-px bg-[hsl(var(--color-accent)/0.3)] lg:-right-5 lg:bottom-auto lg:left-10 lg:top-5 lg:h-px lg:w-auto"
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-0 grid size-10 place-items-center rounded-full font-mono text-xs font-medium tabular-nums",
              step.approval ? "bg-[hsl(var(--color-accent))] text-white" : "bg-[hsl(var(--color-accent-subtle))] text-[hsl(var(--color-accent))]",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className={cn(mono, "text-[hsl(var(--color-foreground-subtle))]")}>{step.who}</p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-[hsl(var(--color-foreground))]">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-foreground-muted))]">{step.text}</p>
          {step.approval && (
            <p className="mt-3">
              <Approval>{step.approval}</Approval>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
