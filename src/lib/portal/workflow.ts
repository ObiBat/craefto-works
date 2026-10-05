import "server-only";
import { createServerClient } from "@/lib/supabase";
import { sydneyToday } from "./hours";
import type { ClientRequest, ClientRequestEvent, ClientTimeEntry, EstimateState, RequestEventKind, RequestStatus } from "./types";

// How a request moves, written with the service role (clients can only read
// these columns and tables): Ask Craefto's initial estimate, Craefto's
// confirmed one, the client's approval into their queue, the work's status,
// the queue's order and the time logged. Each move is kept in the request's
// history (client_request_events) for its timeline.

const db = () => createServerClient();
const now = () => new Date().toISOString();

type RequestRef = Pick<ClientRequest, "id" | "account_id">;

export class WorkflowError extends Error {}

export async function recordEvent(request: RequestRef, kind: RequestEventKind, detail: ClientRequestEvent["detail"] = {}) {
  const { error } = await db().from("client_request_events").insert({ account_id: request.account_id, request_id: request.id, kind, detail });
  if (error) console.error(`Recording "${kind}" on request ${request.id} failed:`, error);
}

/** Update a request, only while it's still as expected (so a move never overwrites one that just happened); null if it isn't. */
async function update(request: RequestRef, changes: Partial<ClientRequest>, only: { estimateState?: EstimateState; statuses?: RequestStatus[] } = {}) {
  let query = db()
    .from("client_requests")
    .update({ ...changes, updated_at: now() })
    .eq("id", request.id)
    .eq("account_id", request.account_id);
  if (only.estimateState) query = query.eq("estimate_state", only.estimateState);
  if (only.statuses) query = query.in("status", only.statuses);
  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw error;
  return data as ClientRequest | null;
}

/** Hours in half hours, within the database's bounds. */
const halfHours = (value: number) => Math.min(400, Math.max(0.5, Math.round(value * 2) / 2));

/** Ask Craefto's initial range: saved only while there's no estimate yet, so it never overwrites Craefto's. */
export async function saveInitialEstimate(request: RequestRef, estimate: { low: number; high: number; note: string }) {
  const low = halfHours(estimate.low);
  const high = Math.max(low, halfHours(estimate.high));
  const saved = await update(
    request,
    { estimate_low: low, estimate_high: high, estimate_note: estimate.note.slice(0, 2000) || null, estimate_state: "initial" },
    { estimateState: "none" }
  );
  if (saved) await recordEvent(request, "estimated", { low, high, by: "assistant" });
  return saved;
}

/** Craefto confirms (or adjusts) the estimate and asks the client to approve it. */
export async function confirmEstimate(request: ClientRequest, estimate: { low: number; high: number; note: string | null; targetDate: string | null }) {
  if (request.status === "delivered" || request.status === "withdrawn") throw new WorkflowError("This request is closed.");
  const low = halfHours(estimate.low);
  const high = Math.max(low, halfHours(estimate.high));
  // Already approved and under way: a new estimate goes back to the client unless the work has started.
  const status: RequestStatus = request.status === "in_progress" || request.status === "needs_info" ? request.status : "estimated";
  const saved = await update(request, {
    estimate_low: low,
    estimate_high: high,
    estimate_note: estimate.note?.slice(0, 2000) || null,
    estimate_state: status === "estimated" ? "confirmed" : "approved",
    target_date: estimate.targetDate,
    status,
    ...(status === "estimated" ? { queue_position: null, approved_at: null } : {}),
  });
  if (!saved) throw new WorkflowError("Request not found.");
  await recordEvent(request, "confirmed", { low, high, by: "craefto", target_date: estimate.targetDate });
  if (status === "estimated") await compactQueue(request.account_id);
  return saved;
}

/** The open, approved requests in their order: the queue. */
async function queueOf(accountId: string) {
  const { data, error } = await db()
    .from("client_requests")
    .select("*")
    .eq("account_id", accountId)
    .not("queue_position", "is", null)
    .in("status", ["queued", "in_progress", "needs_info"])
    .order("queue_position");
  if (error) throw error;
  return (data ?? []) as ClientRequest[];
}

/** Renumber the queue 1, 2, 3… in its current order. */
export async function compactQueue(accountId: string) {
  const queue = await queueOf(accountId);
  await Promise.all(
    queue.map((request, index) =>
      request.queue_position === index + 1 ? null : db().from("client_requests").update({ queue_position: index + 1 }).eq("id", request.id)
    )
  );
}

/** The client approves the confirmed estimate: the request joins the end of their queue. */
export async function approveEstimate(request: ClientRequest) {
  if (request.status !== "estimated" || request.estimate_state !== "confirmed") throw new WorkflowError("There's no estimate waiting for approval on this request.");
  const position = (await queueOf(request.account_id)).length + 1;
  const saved = await update(request, { status: "queued", estimate_state: "approved", approved_at: now(), queue_position: position }, { statuses: ["estimated"] });
  if (!saved) throw new WorkflowError("That estimate changed just now. Have another look.");
  await recordEvent(request, "approved", { low: Number(request.estimate_low), high: Number(request.estimate_high), by: "client", position });
  return saved;
}

/** The client withdraws a request that hasn't started. */
export async function withdrawRequest(request: ClientRequest) {
  if (!["received", "estimated", "queued"].includes(request.status)) throw new WorkflowError("This request is already under way. Message us about it instead.");
  const saved = await update(request, { status: "withdrawn", queue_position: null }, { statuses: ["received", "estimated", "queued"] });
  if (!saved) throw new WorkflowError("This request just moved on. Message us about it instead.");
  await recordEvent(request, "withdrawn", { by: "client" });
  await compactQueue(request.account_id);
  return saved;
}

/** Craefto moves a request on. */
export async function setStatus(request: ClientRequest, status: RequestStatus) {
  if (request.status === status) return request;
  const changes: Partial<ClientRequest> = { status };
  if (status === "delivered") Object.assign(changes, { delivered_at: now(), queue_position: null });
  if (status === "withdrawn") Object.assign(changes, { queue_position: null });
  if (request.status === "delivered" && status !== "delivered") changes.delivered_at = null;
  // Work starting (or needing input) without a place in the queue takes the front: Craefto chose it.
  if ((status === "in_progress" || status === "needs_info" || status === "queued") && request.queue_position == null) changes.queue_position = 0;
  const saved = await update(request, changes);
  if (!saved) throw new WorkflowError("Request not found.");
  const kind: RequestEventKind | null =
    status === "in_progress" ? "started" : status === "needs_info" ? "needs_info" : status === "delivered" ? "delivered" : status === "withdrawn" ? "withdrawn" : request.status === "delivered" ? "reopened" : null;
  if (kind) await recordEvent(request, kind, { by: "craefto" });
  await compactQueue(request.account_id);
  return saved;
}

/** Move a request up or down the queue by one. */
export async function moveInQueue(request: ClientRequest, direction: -1 | 1) {
  const queue = await queueOf(request.account_id);
  const index = queue.findIndex((entry) => entry.id === request.id);
  const other = queue[index + direction];
  if (index < 0 || !other) return;
  await Promise.all([
    db().from("client_requests").update({ queue_position: other.queue_position }).eq("id", request.id),
    db().from("client_requests").update({ queue_position: queue[index].queue_position }).eq("id", other.id),
  ]);
  await compactQueue(request.account_id);
}

/** Log time against a request (or the account generally). */
export async function logTime(accountId: string, entry: { requestId: string | null; minutes: number; note: string; workedOn?: string | null }) {
  const minutes = Math.round(entry.minutes);
  if (!(minutes >= 1 && minutes <= 1440)) throw new WorkflowError("Log between 1 minute and 24 hours.");
  if (entry.requestId) {
    const { data } = await db().from("client_requests").select("id").eq("id", entry.requestId).eq("account_id", accountId).maybeSingle();
    if (!data) throw new WorkflowError("Request not found.");
  }
  const workedOn = entry.workedOn && /^\d{4}-\d{2}-\d{2}$/.test(entry.workedOn) ? entry.workedOn : sydneyToday();
  const { data, error } = await db()
    .from("client_time_entries")
    .insert({ account_id: accountId, request_id: entry.requestId, minutes, note: entry.note.trim().slice(0, 500), worked_on: workedOn })
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientTimeEntry;
}

export async function deleteTime(accountId: string, id: string) {
  const { error } = await db().from("client_time_entries").delete().eq("id", id).eq("account_id", accountId);
  if (error) throw error;
}
