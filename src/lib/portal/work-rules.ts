// The work pipeline's rules (lib/portal/work.ts): request references in pull
// requests, the time commits hint at, the description without its tool
// trailers, and times or estimates typed on a phone. No server imports, so
// they're easy to test on their own.

/** A request's short reference, for a pull request's title, description or branch: R-1a2b3c4d. */
export const requestRef = (id: string) => `R-${id.slice(0, 8)}`;

/** The request prefixes (8 hex characters) these texts reference, once each, in order. */
export function refsIn(...texts: Array<string | null | undefined>): string[] {
  const found: string[] = [];
  for (const text of texts) {
    for (const match of (text ?? "").matchAll(/(?:^|[^0-9a-z])r-([0-9a-f]{8})(?![0-9a-z])/gi)) {
      const ref = match[1].toLowerCase();
      if (!found.includes(ref)) found.push(ref);
    }
  }
  return found;
}

/** Commits within this many minutes of each other are one sitting. */
const SESSION_GAP = 45;
/** The work before a sitting's first commit, which no commit shows. */
const LEAD_IN = 15;

export interface CommitHint {
  /** The sittings' spans, each with its lead-in. */
  minutes: number;
  commits: number;
  sessions: number;
}

/** What commit times say about the time a change took: a floor, since work before the first commit doesn't show. */
export function commitHint(times: string[]): CommitHint | null {
  const sorted = times
    .map((time) => Date.parse(time))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  let sessions = 1;
  let minutes = LEAD_IN;
  let start = sorted[0];
  let last = sorted[0];
  for (const at of sorted.slice(1)) {
    if (at - last > SESSION_GAP * 60_000) {
      minutes += (last - start) / 60_000 + LEAD_IN;
      sessions += 1;
      start = at;
    }
    last = at;
  }
  minutes += (last - start) / 60_000;
  return { minutes: Math.round(minutes), commits: sorted.length, sessions };
}

/** Minutes to the quarter hour, at least a quarter. */
export const quarterHours = (minutes: number) => Math.max(15, Math.round(minutes / 15) * 15);

/** "45 min", "1.5 h", "1.25 h" */
export function minutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  return `${Number((minutes / 60).toFixed(2))} h`;
}

/** A pull request's description without the tool trailers (generated-with lines, session links, co-authors, comments). */
export function cleanBody(body: string | null | undefined): string {
  return (body ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((line) => !/^\s*(?:🤖\s*Generated with|Co-Authored-By:|Claude-Session:|https:\/\/claude\.ai\/code\/session_)/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Hosts whose links aren't the client's to open: code hosting, previews, tools, this machine. */
const PRIVATE_HOSTS = /(^|\.)(github\.com|githubusercontent\.com|claude\.ai|vercel\.app|vercel\.com|supabase\.co|supabase\.com|localhost)$|^(127\.|10\.|192\.168\.)/;

/** Web addresses in a description that the client can open (their own site, a document), up to four. */
export function linksIn(text: string): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];
  for (const match of text.matchAll(/https?:\/\/[^\s)<>\]"'`]+/g)) {
    const raw = match[0].replace(/[.,;:!?]+$/, "");
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (PRIVATE_HOSTS.test(url.hostname) || links.some((link) => link.url === url.toString())) continue;
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    links.push({ label: `${url.hostname.replace(/^www\./, "")}${path}`.slice(0, 80), url: url.toString() });
    if (links.length === 4) break;
  }
  return links;
}

const UNIT_HOURS = "(?:h|hr|hrs|hour|hours)";
const UNIT_MINUTES = "(?:m|min|mins|minute|minutes)";

/** Minutes from a time typed on a phone: 1.5, 1.5h, 90m, 90 min, 1h30, 1h 30m, 1:30, 2 hours. Null if it isn't one. */
export function parseDuration(text: string): number | null {
  const value = text.trim().toLowerCase().replace(",", ".");
  let minutes: number | null = null;
  let match: RegExpMatchArray | null;
  if ((match = value.match(/^(\d{1,2}):([0-5]\d)$/))) minutes = Number(match[1]) * 60 + Number(match[2]);
  else if ((match = value.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${UNIT_HOURS}\\s*(?:(\\d{1,2})\\s*${UNIT_MINUTES}?)?$`)))) minutes = Number(match[1]) * 60 + Number(match[2] ?? 0);
  else if ((match = value.match(new RegExp(`^(\\d+)\\s*${UNIT_MINUTES}$`)))) minutes = Number(match[1]);
  else if ((match = value.match(/^(\d+(?:\.\d+)?)$/))) minutes = Number(match[1]) * 60;
  if (minutes === null || !Number.isFinite(minutes)) return null;
  minutes = Math.round(minutes);
  return minutes >= 1 && minutes <= 1440 ? minutes : null;
}

/** A time at the start of a message, and the note after it: "1h 30m fixed the menu" is 90 minutes and "fixed the menu". */
export function splitDuration(text: string): { minutes: number; note: string } | null {
  const words = text.trim().split(/\s+/);
  for (const count of [3, 2, 1]) {
    if (words.length < count) continue;
    const minutes = parseDuration(words.slice(0, count).join(" "));
    if (minutes !== null) return { minutes, note: words.slice(count).join(" ") };
  }
  return null;
}

/** An estimate typed on a phone, and any note after it: "3-5", "3 to 5 h", "2.5h", "3–5 covers the two pages". Hours, low to high, up to 400. */
export function parseEstimate(text: string): { low: number; high: number; note: string } | null {
  const value = text.trim().replace(/(\d),(\d)/g, "$1.$2");
  const match = value.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${UNIT_HOURS}?(?:\\s*(?:-|–|—|to)\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT_HOURS}?)?(?=\\s|$)\\s*([\\s\\S]*)$`, "i"));
  if (!match) return null;
  const low = Number(match[1]);
  const high = match[2] != null ? Number(match[2]) : low;
  if (!(low > 0 && high >= low && high <= 400)) return null;
  return { low, high, note: match[3].trim() };
}

/** "2 commits in 1 sitting" */
export function commitNote(hint: CommitHint) {
  return `${hint.commits} commit${hint.commits === 1 ? "" : "s"} in ${hint.sessions} sitting${hint.sessions === 1 ? "" : "s"}`;
}

/** "Japanoma-com/japanoMa" or its GitHub address → "japanoma-com/japanoma"; null if it isn't a repository. */
export function repoName(input: string): string | null {
  const value = input
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
  return /^[a-z0-9-]+\/[a-z0-9._-]+$/.test(value) ? value : null;
}

export interface WorkCalibration {
  /** "Users list: Followed up column: you suggested 45 min; Craefto confirmed 1.5 h" */
  client: string[];
  /** The median of confirmed ÷ suggested across recent published work, when there are enough to go on. */
  ratio: number | null;
  pairs: number;
}

/** How Craefto changed the suggested times on published work: this client's by name, and a ratio across everyone's (numbers only). */
export function calibrationOf(
  drafts: Array<{ account_id: string; title: string; suggested_minutes: number | null; published_minutes: number | null }>,
  accountId: string
): WorkCalibration {
  const pairs = drafts.filter((draft) => (draft.suggested_minutes ?? 0) > 0 && (draft.published_minutes ?? 0) > 0);
  const ratios = pairs.map((draft) => draft.published_minutes! / draft.suggested_minutes!).sort((a, b) => a - b);
  const client = pairs
    .filter((draft) => draft.account_id === accountId && draft.published_minutes !== draft.suggested_minutes)
    .slice(0, 8)
    .map((draft) => `${draft.title}: you suggested ${minutesLabel(draft.suggested_minutes!)}; Craefto confirmed ${minutesLabel(draft.published_minutes!)}`);
  return { client, ratio: ratios.length >= 3 ? ratios[Math.floor(ratios.length / 2)] : null, pairs: ratios.length };
}
