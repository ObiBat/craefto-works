import "server-only";
import { createHash } from "node:crypto";
import type { Evidence } from "./types";

// "No evidence, no send" (the plan, section 05). Just before an email goes
// out, the page where the address was published is fetched again: the
// address must still be there, with no notice asking not to be sent
// unsolicited email. The result is kept with the message as the record of
// what consent rested on.

export type { Evidence };


/** The page an address was published on: a URL, or "Published on site.com/contact". */
export function sourceUrl(source: string | undefined): string | null {
  const text = source?.trim() ?? "";
  const url = text.match(/https?:\/\/[^\s)"'<>]+/i)?.[0] ?? text.match(/^published on\s+([a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)]*)?)/i)?.[1];
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).toString();
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", commat: "@", period: "." };

function decodeEntities(html: string) {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

/** Cloudflare's email protection hides addresses as hex, XORed with the first byte. */
function cloudflareEmails(html: string) {
  return [...html.matchAll(/data-cfemail="([0-9a-f]+)"|email-protection#([0-9a-f]+)/gi)].map((match) => {
    const hex = match[1] ?? match[2];
    const key = parseInt(hex.slice(0, 2), 16);
    let out = "";
    for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    return out.toLowerCase();
  });
}

const NOTICES = [
  /no unsolicited (?:commercial )?(?:e-?mails?|messages?|marketing|solicitations?)/i,
  /(?:do not|don'?t|please do not|please don'?t)\s+(?:send|e-?mail)\s+(?:us\s+)?(?:any\s+)?(?:unsolicited|marketing|commercial|promotional|sales)/i,
  /(?:not|no longer)\s+(?:wish|want|consent)\s+to\s+receive\s+(?:any\s+)?(?:unsolicited|commercial|marketing|promotional)/i,
  /unsolicited\s+(?:commercial\s+)?(?:e-?mails?|messages?|electronic messages?)\s+(?:are|will)\s+not/i,
  /(?:we|i)\s+do\s+not\s+(?:accept|welcome)\s+(?:unsolicited|cold|marketing)/i,
];

/** Ordinary browser headers: many small-business sites turn away anything that doesn't look like one. */
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-AU,en;q=0.9",
};

/** Fetches the published page and checks the address is still there with no "no unsolicited email" notice. */
export async function checkEvidence(address: string, source: string | undefined, fetchImpl: typeof fetch = fetch): Promise<Evidence> {
  const url = sourceUrl(source);
  const base: Evidence = { url, checkedAt: new Date().toISOString(), ok: false, addressFound: false, notice: null, pageHash: null, status: null };
  if (!url) return { ...base, error: "No page is recorded for this address" };
  let res: Response;
  try {
    res = await fetchImpl(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: HEADERS,
    });
  } catch (error) {
    return { ...base, error: `The page didn't load (${(error as Error).name === "TimeoutError" ? "timed out" : (error as Error).message})` };
  }
  if (!res.ok) return { ...base, status: res.status, error: `The page answered ${res.status}` };
  const html = (await res.text()).slice(0, 3_000_000);
  const text = decodeEntities(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const wanted = address.trim().toLowerCase();
  const addressFound =
    text.toLowerCase().includes(wanted) || decodeEntities(html).toLowerCase().includes(`mailto:${wanted}`) || cloudflareEmails(html).includes(wanted);
  const domain = wanted.split("@")[1] ?? "";
  const shown = new Set([...(decodeEntities(html).toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? []), ...cloudflareEmails(html)]);
  const otherAddresses = [...shown].filter((found) => found !== wanted && found.endsWith(`@${domain}`)).slice(0, 5);
  const notice = NOTICES.map((pattern) => text.match(pattern)).find(Boolean);
  const sentence = notice ? text.slice(Math.max(0, (notice.index ?? 0) - 80), (notice.index ?? 0) + notice[0].length + 80).trim() : null;
  return {
    ...base,
    status: res.status,
    addressFound,
    notice: sentence,
    pageHash: createHash("sha256").update(text).digest("hex"),
    ok: addressFound && !sentence,
    ...(otherAddresses.length ? { otherAddresses } : {}),
    ...(addressFound ? {} : { error: `${wanted} isn't on the page any more${otherAddresses.length ? `; it shows ${otherAddresses.join(", ")}` : ""}` }),
  };
}
