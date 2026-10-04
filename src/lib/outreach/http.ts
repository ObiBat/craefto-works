import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, safeEqual, verifyAdminSession } from "@/lib/admin-session";
import { OutreachError } from "./rules";
import type { Actor } from "./types";

// What the outreach admin routes share: who is asking, and turning refusals
// into readable JSON errors. src/proxy.ts already guards /api/admin; these
// routes check again because approving here authorises sending.

/** The command centre (API token) or a signed-in admin; null for anyone else. */
export async function outreachActor(request: NextRequest): Promise<Actor | null> {
  const token = process.env.ADMIN_API_TOKEN;
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token && bearer && (await safeEqual(bearer, token))) return "command-centre";
  return (await verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) ? "admin" : null;
}

export const ok = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
export const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/** Runs a route for an admin, with refusals and bad input as 4xx responses and anything else as a logged 500. */
export async function handle(request: NextRequest, run: (actor: Actor) => Promise<Response>): Promise<Response> {
  const actor = await outreachActor(request);
  if (!actor) return fail("Unauthorized", 401);
  try {
    return await run(actor);
  } catch (error) {
    if (error instanceof OutreachError) return fail(error.message, error.status);
    if (error instanceof z.ZodError) return fail(error.issues.map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message)).join("; "), 400);
    if (error instanceof SyntaxError) return fail("The request wasn't valid JSON", 400);
    console.error(`Outreach ${request.method} ${request.nextUrl.pathname} failed:`, error);
    return fail("Something went wrong", 500);
  }
}

export const idSchema = z.string().regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes").max(100);
export const prioritySchema = z.enum(["A", "B", "C"]);
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/, "Not an email fingerprint");

/** Route params, checked: only ids the store could hold. */
export async function ids<T extends Record<string, string>>(params: Promise<T>): Promise<T> {
  const values = await params;
  for (const value of Object.values(values)) if (!idSchema.safeParse(value).success) throw new OutreachError("No such prospect", 404);
  return values;
}
