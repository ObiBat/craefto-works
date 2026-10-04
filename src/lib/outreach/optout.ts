import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@/lib/supabase";
import { OutreachError } from "./rules";
import { getProspect, updateProspect } from "./store";

// The opt-out link every email carries in its List-Unsubscribe header, which
// mail apps show as an Unsubscribe button (one click, RFC 8058). The token
// names the prospect, signed so it can't be guessed or altered, and never
// holds the address itself. A test copy's token is marked as a test, so
// trying the button in a test can't suppress a real prospect.

const SITE = "https://www.craefto.com";

function secret() {
  const value = process.env.OUTREACH_OPTOUT_SECRET;
  if (!value) throw new OutreachError("Opt-out links aren't set up (OUTREACH_OPTOUT_SECRET)", 500);
  return value;
}

export const optoutConfigured = () => Boolean(process.env.OUTREACH_OPTOUT_SECRET);

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 32);

export function optoutToken(campaignId: string, prospectId: string, test: boolean) {
  const payload = Buffer.from(JSON.stringify({ c: campaignId, p: prospectId, ...(test ? { t: 1 } : {}) })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | null | undefined): { campaignId: string; prospectId: string; test: boolean } | null {
  const [payload, signature] = (token ?? "").split(".");
  // Without the secret no link can be genuine (and the sender won't send).
  if (!payload || !signature || !optoutConfigured()) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.c === "string" && typeof data.p === "string" ? { campaignId: data.c, prospectId: data.p, test: data.t === 1 } : null;
  } catch {
    return null;
  }
}

/** The header pair for an email: the one-click link, and a mailto fallback. */
export function unsubscribeHeaders(campaignId: string, prospectId: string, test: boolean, mailbox: string) {
  return {
    "List-Unsubscribe": `<${SITE}/api/optout?t=${optoutToken(campaignId, prospectId, test)}>, <mailto:${mailbox}?subject=Unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Records an opt-out: the address goes on the do-not-email list (never removed
 * automatically) and the prospect is closed. Safe to repeat.
 */
export async function optOut(token: string | null | undefined, via: "link" | "one-click") {
  const read = readToken(token);
  if (!read) return { ok: false as const };
  if (read.test) return { ok: true as const, test: true };
  const prospect = await getProspect(read.campaignId, read.prospectId);
  if (!prospect) return { ok: false as const };
  const address = prospect.contact.value.trim().toLowerCase();
  const db = createServerClient();
  const { error } = await db
    .from("outreach_suppressions")
    .upsert(
      { value: address, reason: "opt-out", note: `Opted out with the email's ${via === "one-click" ? "unsubscribe button" : "link"} on ${new Date().toISOString().slice(0, 10)}` },
      { onConflict: "value", ignoreDuplicates: true },
    );
  if (error) throw error;
  await updateProspect(read.campaignId, read.prospectId, "system", (p) => {
    if (p.status === "not-a-fit") return null;
    p.status = "not-a-fit";
    return `Opted out (${via === "one-click" ? "unsubscribe button" : "link"}): ${address} is on the do-not-email list`;
  });
  return { ok: true as const, test: false };
}
