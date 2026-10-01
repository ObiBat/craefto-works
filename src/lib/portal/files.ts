import "server-only";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@/lib/supabase";
import { MAX_FILES, fileProblem } from "./file-rules";
import type { ClientAccount, ClientFile } from "./types";

// Files shared in the portal. They go straight from the browser to the
// private client-files bucket through one-time signed upload links (so they
// never pass through the site's 4.5 MB request limit), are recorded as
// 'pending', and become 'attached' when the request or message they belong
// to is sent. Downloads are short-lived signed links, always as attachments.

export const FILES_BUCKET = "client-files";

const db = () => createServerClient();

/** A message for the person uploading, rather than a server fault. */
export class FileRuleError extends Error {}

export interface UploadSlot {
  id: string;
  /** One-time link the browser uploads the file to. */
  url: string;
}

const displayName = (name: string) =>
  name
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 200) || "file";

/** A storage key from the file's name: letters, digits, dots, dashes. */
const storageName = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100) || "file";

/** Remove an account's uploads that were never sent (older than a day). */
async function clearStaleUploads(accountId: string) {
  const since = new Date(Date.now() - 24 * 3600e3).toISOString();
  const { data: stale } = await db()
    .from("client_files")
    .select("id, path")
    .eq("account_id", accountId)
    .eq("status", "pending")
    .lt("created_at", since);
  if (!stale?.length) return;
  await db().storage.from(FILES_BUCKET).remove(stale.map((file) => file.path));
  await db().from("client_files").delete().in("id", stale.map((file) => file.id));
}

/** Check a batch of files and hand out an upload link for each. */
export async function prepareUploads(
  account: ClientAccount,
  by: ClientFile["uploaded_by"],
  files: Array<{ name: string; size: number; type?: string }>
): Promise<UploadSlot[]> {
  if (!Array.isArray(files) || files.length === 0) throw new FileRuleError("Choose a file to upload.");
  if (files.length > MAX_FILES) throw new FileRuleError(`Send up to ${MAX_FILES} files at a time.`);
  for (const file of files) {
    const problem = fileProblem({ name: String(file?.name ?? ""), size: Number(file?.size) });
    if (problem) throw new FileRuleError(problem);
  }
  await clearStaleUploads(account.id);

  const slots: UploadSlot[] = [];
  for (const file of files) {
    const id = randomUUID();
    const name = displayName(file.name);
    const path = `${account.id}/${id}/${storageName(name)}`;
    const { error } = await db()
      .from("client_files")
      .insert({ id, account_id: account.id, uploaded_by: by, name, size: Math.round(file.size), content_type: file.type || null, path });
    if (error) throw error;
    const { data, error: signError } = await db().storage.from(FILES_BUCKET).createSignedUploadUrl(path);
    if (signError || !data) throw signError ?? new Error("No upload link returned.");
    slots.push({ id, url: data.signedUrl });
  }
  return slots;
}

/**
 * Of the given upload ids, those this account uploaded (as `by`) that really
 * arrived in storage, with their stored size. Anything else is ignored.
 */
export async function readyUploads(account: ClientAccount, ids: string[], by: ClientFile["uploaded_by"]): Promise<ClientFile[]> {
  const wanted = [...new Set(ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)))].slice(0, MAX_FILES);
  if (wanted.length === 0) return [];
  const { data: rows } = await db()
    .from("client_files")
    .select("*")
    .in("id", wanted)
    .eq("account_id", account.id)
    .eq("uploaded_by", by)
    .eq("status", "pending");
  const ready: ClientFile[] = [];
  for (const row of (rows ?? []) as ClientFile[]) {
    const folder = row.path.slice(0, row.path.lastIndexOf("/"));
    const { data: objects } = await db().storage.from(FILES_BUCKET).list(folder);
    const stored = objects?.find((object) => `${folder}/${object.name}` === row.path);
    const size = Number(stored?.metadata?.size);
    if (stored && size > 0) ready.push({ ...row, size });
  }
  return ready;
}

/** Attach checked uploads to the request and/or message they were sent with. */
export async function attachUploads(files: ClientFile[], target: { requestId: string | null; messageId: string | null }): Promise<ClientFile[]> {
  const attached: ClientFile[] = [];
  for (const file of files) {
    const { data, error } = await db()
      .from("client_files")
      .update({ status: "attached", size: file.size, request_id: target.requestId, message_id: target.messageId })
      .eq("id", file.id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (error) throw error;
    attached.push(data as ClientFile);
  }
  return attached;
}

/** A link that downloads the file for the next minute, under its own name. */
export async function downloadLink(file: Pick<ClientFile, "path" | "name">): Promise<string | null> {
  const { data } = await db().storage.from(FILES_BUCKET).createSignedUrl(file.path, 60, { download: file.name });
  return data?.signedUrl ?? null;
}

export async function fileById(id: string): Promise<ClientFile | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db().from("client_files").select("*").eq("id", id).eq("status", "attached").maybeSingle();
  return (data as ClientFile) ?? null;
}
