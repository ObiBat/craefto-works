import type { ClientRequest, OutcomeLink } from "./types";

// A delivered request's outcome: Craefto's words on what was delivered and what
// it changed, and links to the work. Written in admin, shown in the portal on
// the request, on the overview and under Past work.

export class OutcomeInputError extends Error {}

const MAX_OUTCOME = 4000;
const MAX_LINKS = 8;

/** A link, if it's a web address; labelled with its site when no label is given. */
function cleanLink(value: unknown): OutcomeLink | null {
  if (!value || typeof value !== "object") return null;
  const { label, url } = value as Record<string, unknown>;
  if (typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const name = typeof label === "string" && label.trim() ? label.trim().slice(0, 80) : parsed.hostname.replace(/^www\./, "");
  return { label: name, url: parsed.toString() };
}

/** Checked outcome fields from Craefto's input (only those given). */
export function outcomeInput(input: Record<string, unknown>): Partial<Pick<ClientRequest, "outcome" | "outcome_links">> {
  const fields: Partial<Pick<ClientRequest, "outcome" | "outcome_links">> = {};
  if ("outcome" in input) {
    if (input.outcome != null && typeof input.outcome !== "string") throw new OutcomeInputError("Write the outcome as text.");
    const text = typeof input.outcome === "string" ? input.outcome.trim() : "";
    if (text.length > MAX_OUTCOME) throw new OutcomeInputError(`Keep the outcome under ${MAX_OUTCOME.toLocaleString("en-AU")} characters.`);
    fields.outcome = text || null;
  }
  if ("outcome_links" in input) {
    if (!Array.isArray(input.outcome_links)) throw new OutcomeInputError("Links should be a list.");
    const links = input.outcome_links.map(cleanLink);
    if (links.some((link) => link === null)) throw new OutcomeInputError("Each link needs a web address starting with https://.");
    if (links.length > MAX_LINKS) throw new OutcomeInputError(`Add up to ${MAX_LINKS} links.`);
    fields.outcome_links = links as OutcomeLink[];
  }
  return fields;
}

/** A request's links, read defensively: anything that isn't a web address shows nothing. */
export const linksOf = (request: Pick<ClientRequest, "outcome_links">): OutcomeLink[] =>
  Array.isArray(request.outcome_links) ? request.outcome_links.map(cleanLink).filter((link): link is OutcomeLink => link !== null) : [];

/** Links typed one a line as "Label | https://…" (or just the address), for admin's form. */
export function parseLinkLines(text: string): Array<{ label: string; url: string }> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const bar = line.lastIndexOf("|");
      return bar === -1 ? { label: "", url: line } : { label: line.slice(0, bar).trim(), url: line.slice(bar + 1).trim() };
    });
}

/** The reverse, to edit links that are already saved. */
export const linkLines = (links: OutcomeLink[]) => links.map((link) => `${link.label} | ${link.url}`).join("\n");
