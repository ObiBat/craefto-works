"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { accountByEmail, createSignIn, takeSignInSlot } from "@/lib/portal/accounts";
import { FileRuleError, attachUploads, prepareUploads, readyUploads, type UploadSlot } from "@/lib/portal/files";
import { alertApproved, alertMessage, alertRequest, sendSignInLink } from "@/lib/portal/notify";
import { reviewRequest } from "@/lib/portal/assistant";
import { sydneyToday } from "@/lib/portal/hours";
import { WorkflowError, approveEstimate, recordEvent, withdrawRequest as withdraw } from "@/lib/portal/workflow";
import { siteOrigin } from "@/lib/portal/origin";
import { requireMember } from "@/lib/portal/session";
import type { ClientMessage, ClientRequest } from "@/lib/portal/types";
import { billingPortalConfiguration, stripe } from "@/lib/stripe";

// The portal's forms. Requests and messages are written as the signed-in
// client (through RLS); Craefto hears about each by email. Files are uploaded
// first (prepareFileUploads) and sent with the form as their ids.

export interface FormState {
  error?: string;
  /** What was sent, so a form can show it again: React clears a form after its action runs. */
  values?: Record<string, string>;
}

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const fileIds = (formData: FormData) => formData.getAll("files").map(String);

/** Upload links for files the client is about to send. */
export async function prepareFileUploads(input: {
  files: Array<{ name: string; size: number; type: string }>;
}): Promise<{ slots?: UploadSlot[]; error?: string }> {
  const member = await requireMember();
  try {
    return { slots: await prepareUploads(member.account, "client", input.files) };
  } catch (error) {
    if (error instanceof FileRuleError) return { error: error.message };
    console.error("Preparing uploads failed:", error);
    return { error: "Uploads aren't available just now. Please try again." };
  }
}

/**
 * Email a sign-in link. The answer is the same whether or not the address is
 * a client's, so the form can't be used to find out who is (and only
 * clients' addresses get a link: making one creates the login).
 */
export async function sendLoginLink(_: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter the email address you subscribed with.", values: { email } };
  const account = await accountByEmail(email);
  if (account && (await takeSignInSlot(account))) {
    try {
      const { tokenHash, type } = await createSignIn(account);
      const link = `${await siteOrigin()}/portal/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`;
      await sendSignInLink(account, link);
    } catch (error) {
      console.error("Sending a sign-in link failed:", error);
    }
  }
  redirect(`/portal/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function createRequest(_: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  const title = text(formData, "title");
  const details = text(formData, "details");
  const neededBy = text(formData, "needed_by");
  const fail = (error: string): FormState => ({ error, values: { title, details, needed_by: neededBy } });
  if (!member.allowance) return fail("Your plan isn't active, so new requests are paused. Message us if that's unexpected.");
  if (!title) return fail("Give the request a short title.");
  if (neededBy && (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy) || neededBy < sydneyToday())) return fail("Choose a date from today on, or leave “Needed by” empty.");
  if (title.length > 200) return fail("Keep the title under 200 characters; the details can be as long as you like.");
  if (details.length > 10000) return fail("That's a lot of detail. Trim it under 10,000 characters, or send the rest as a message.");

  const uploads = await readyUploads(member.account, fileIds(formData), "client");
  const { data, error } = await member.db
    .from("client_requests")
    .insert({ account_id: member.account.id, title, details, needed_by: neededBy || null })
    .select("*")
    .single();
  if (error || !data) {
    console.error("Saving a request failed:", error);
    return fail("We couldn't save that just now. Please try again.");
  }
  const request = data as ClientRequest;
  const origin = await siteOrigin();
  const files = await attachUploads(uploads, { requestId: request.id, messageId: null });
  await recordEvent(request, "sent", { by: "client" });
  await alertRequest(member.account, request, files, origin);
  // Ask Craefto replies with an initial estimate once the page has loaded (the page waits for it).
  after(() => reviewRequest(request.id, origin));
  revalidatePath("/portal", "layout");
  redirect(`/portal/requests/${request.id}?sent=1`);
}

/** The request this form is about, if it's the signed-in client's (their RLS read says so). */
async function ownRequest(formData: FormData) {
  const member = await requireMember();
  const id = text(formData, "request_id");
  const { data } = id ? await member.db.from("client_requests").select("*").eq("id", id).maybeSingle() : { data: null };
  return { member, request: (data as ClientRequest | null) ?? null };
}

/** Approve Craefto's confirmed estimate: the request joins the client's queue. */
export async function approveRequest(_: FormState, formData: FormData): Promise<FormState> {
  const { member, request } = await ownRequest(formData);
  if (!request) return { error: "That request isn't yours or no longer exists." };
  try {
    const approved = await approveEstimate(request);
    await alertApproved(member.account, approved, await siteOrigin());
  } catch (error) {
    if (error instanceof WorkflowError) return { error: error.message };
    console.error("Approving an estimate failed:", error);
    return { error: "That didn't go through. Please try again." };
  }
  revalidatePath("/portal", "layout");
  redirect(`/portal/requests/${request.id}?approved=1`);
}

/** Withdraw a request that hasn't started. */
export async function withdrawRequest(_: FormState, formData: FormData): Promise<FormState> {
  const { member, request } = await ownRequest(formData);
  if (!request) return { error: "That request isn't yours or no longer exists." };
  try {
    await withdraw(request);
  } catch (error) {
    if (error instanceof WorkflowError) return { error: error.message };
    console.error("Withdrawing a request failed:", error);
    return { error: "That didn't go through. Please try again." };
  }
  await alertMessage(
    member.account,
    { id: "", account_id: member.account.id, request_id: request.id, author: "client", body: "I've withdrawn this request.", created_at: new Date().toISOString() },
    request,
    [],
    await siteOrigin()
  );
  revalidatePath("/portal", "layout");
  redirect(`/portal/requests/${request.id}`);
}

export async function sendMessage(_: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  const body = text(formData, "body");
  const requestId = text(formData, "request_id") || null;
  const fail = (error: string): FormState => ({ error, values: { body } });
  const ids = fileIds(formData);
  if (!body && ids.length === 0) return fail("Write a message or attach a file.");
  if (body.length > 10000) return fail("Keep a message under 10,000 characters.");
  const uploads = await readyUploads(member.account, ids, "client");
  if (!body && uploads.length === 0) return fail("Your files didn't finish uploading. Attach them again, then send.");

  let request: ClientRequest | null = null;
  if (requestId) {
    const { data } = await member.db.from("client_requests").select("*").eq("id", requestId).maybeSingle();
    if (!data) return fail("That request isn't yours or no longer exists.");
    request = data as ClientRequest;
  }
  const { data, error } = await member.db
    .from("client_messages")
    .insert({ account_id: member.account.id, request_id: requestId, author: "client", body })
    .select("*")
    .single();
  if (error || !data) {
    console.error("Saving a message failed:", error);
    return fail("We couldn't send that just now. Please try again.");
  }
  const files = await attachUploads(uploads, { requestId, messageId: data.id });
  await alertMessage(member.account, data as ClientMessage, request, files, await siteOrigin());
  revalidatePath(request ? `/portal/requests/${request.id}` : "/portal/messages");
  return {};
}

/**
 * Stripe's billing portal: invoices, the card on file, switching plans,
 * cancelling. A returning client may pay for two plans as two Stripe
 * customers, so a form can name which; otherwise it's the one with a payment
 * due, or the newest running plan's.
 */
export async function openBilling(formData?: FormData): Promise<void> {
  const member = await requireMember();
  const theirs = new Set([member.account.stripe_customer_id, ...member.subscriptions.map((subscription) => subscription.stripe_customer_id)]);
  const asked = String(formData?.get("customer") ?? "");
  const owing = member.subscriptions.find((subscription) => subscription.status === "past_due" || subscription.status === "unpaid");
  const customer =
    (asked && theirs.has(asked) ? asked : null) ??
    owing?.stripe_customer_id ??
    member.plans[0]?.stripe_customer_id ??
    member.account.stripe_customer_id;
  if (!customer) redirect("/portal/billing");
  let url: string | null = null;
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer,
      configuration: await billingPortalConfiguration(),
      return_url: `${await siteOrigin()}/portal/billing`,
    });
    url = session.url;
  } catch (error) {
    console.error("Opening the billing portal failed:", error);
  }
  redirect(url ?? "/portal/billing?unavailable=1");
}
