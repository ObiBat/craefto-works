import { RichText } from "@/components/assistant/rich-text";
import { longHours } from "@/lib/portal/hours";
import { linksOf } from "@/lib/portal/outcome";
import { estimateLabel, type ClientRequest, type OutcomeLink } from "@/lib/portal/types";
import { cn } from "@/lib/utils";
import { sydneyDate } from "./thread";

/** When it was delivered, and the time it took against its estimate. */
export function deliveryFacts(request: ClientRequest, minutes: number): string[] {
  const facts: string[] = [];
  const delivered = request.delivered_at ?? request.updated_at;
  facts.push(`Delivered ${sydneyDate(delivered)}`);
  const estimate = estimateLabel(request);
  if (minutes > 0) facts.push(`${longHours(minutes / 60)} logged${estimate ? ` against an estimate of ${estimate}` : ""}`);
  else if (estimate) facts.push(`Estimated at ${estimate}`);
  return facts;
}

/** Links to the delivered work, as quiet pills that open in a new tab. */
export function OutcomeLinks({ links, className }: { links: OutcomeLink[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--color-background))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-accent))] transition-colors hover:bg-[hsl(var(--color-background-subtle))]"
          >
            {link.label}
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M9 7h8v8" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** What a delivered request achieved: Craefto's outcome, links to the work, and the time it took. */
export function Outcome({ request, minutes, className }: { request: ClientRequest; minutes: number; className?: string }) {
  const links = linksOf(request);
  return (
    <section aria-label="What we delivered" className={cn("flex flex-col gap-4 rounded-3xl bg-[hsl(var(--color-accent-subtle))] p-6 md:p-8", className)}>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold tracking-tight text-[hsl(var(--color-foreground))]">What we delivered</p>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{deliveryFacts(request, minutes).join(" · ")}</p>
      </div>
      {request.outcome ? (
        <div className="max-w-2xl leading-relaxed text-[hsl(var(--color-foreground))]">
          <RichText text={request.outcome} />
        </div>
      ) : (
        <p className="max-w-2xl leading-relaxed text-[hsl(var(--color-foreground-muted))]">Done and handed over. Anything to add or change? Reply below.</p>
      )}
      <OutcomeLinks links={links} />
    </section>
  );
}
