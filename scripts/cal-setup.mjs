#!/usr/bin/env node
/**
 * Sets up Cal.com for the client portal's Calls page. Safe to run again:
 *
 *   node scripts/cal-setup.mjs              set up (the webhook stays as it is, or off when new)
 *   node scripts/cal-setup.mjs --activate   also switch the webhook on (once the site is live)
 *   node scripts/cal-setup.mjs --deactivate switch it off
 *
 * - A "Client call" event (craefto/client-call): 30 minutes on Google Meet,
 *   on the default availability, hidden from the public cal.com/craefto page
 *   so prospects still only see the Discovery Call. The portal embeds it
 *   (CAL_BOOKING_LINK, src/lib/portal/meetings.ts).
 * - A webhook on that event only, to www.craefto.com/api/cal/webhook, for
 *   bookings, reschedules and cancellations, signed with CAL_WEBHOOK_SECRET
 *   (the same value must be set where the site runs).
 *
 * Reads CAL_API_KEY and CAL_WEBHOOK_SECRET from the environment or
 * .env.local. Prints IDs only, never keys or secrets.
 */
import { readFileSync } from "node:fs";

const SLUG = "client-call";
const WEBHOOK_URL = "https://www.craefto.com/api/cal/webhook";
const TRIGGERS = ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"];
const EVENT = {
  title: "Client call",
  slug: SLUG,
  lengthInMinutes: 30,
  description:
    "For Craefto clients: kick off a request, talk through feedback or plan what's next. The Google Meet link is in your invite.",
  locations: [{ type: "integration", integration: "google-meet" }],
  hidden: true,
};

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .find((entry) => entry.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

const key = env("CAL_API_KEY");
const secret = env("CAL_WEBHOOK_SECRET");
if (!key || !secret) {
  console.error("Set CAL_API_KEY and CAL_WEBHOOK_SECRET in .env.local (or the environment) first.");
  process.exit(1);
}
const active = process.argv.includes("--activate") ? true : process.argv.includes("--deactivate") ? false : undefined;

async function api(method, path, body) {
  const res = await fetch(`https://api.cal.com/v2${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "cal-api-version": "2024-06-14", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json?.error ?? json)}`);
  return json?.data;
}

// ── The event ─────────────────────────────────────────────────────────────

const me = await api("GET", "/me");
const types = await api("GET", `/event-types?username=${encodeURIComponent(me.username)}`);
let event = types.find((type) => type.slug === SLUG);
if (event) {
  event = await api("PATCH", `/event-types/${event.id}`, EVENT);
  console.log(`Event: updated "${event.title}" (${event.id}), ${me.username}/${SLUG}`);
} else {
  event = await api("POST", "/event-types", EVENT);
  console.log(`Event: created "${event.title}" (${event.id}), ${me.username}/${SLUG}`);
}
console.log(`  ${event.lengthInMinutes} min, ${event.locations?.map((location) => location.integration ?? location.type).join(", ")}, ${event.hidden ? "hidden from" : "shown on"} the public page`);

// ── The webhook ───────────────────────────────────────────────────────────

const hooks = await api("GET", `/event-types/${event.id}/webhooks`);
const existing = (Array.isArray(hooks) ? hooks : []).find((hook) => hook.subscriberUrl === WEBHOOK_URL);
const settings = { subscriberUrl: WEBHOOK_URL, triggers: TRIGGERS, secret, version: "2021-10-20" };
const hook = existing
  ? await api("PATCH", `/event-types/${event.id}/webhooks/${existing.id}`, { ...settings, ...(active === undefined ? {} : { active }) })
  : await api("POST", `/event-types/${event.id}/webhooks`, { ...settings, active: active ?? false });
console.log(`Webhook: ${existing ? "updated" : "created"} (${hook.id}), ${hook.active ? "ON" : "off"}, ${WEBHOOK_URL}`);
if (!hook.active) console.log("  Switch it on once the site is live: node scripts/cal-setup.mjs --activate");
