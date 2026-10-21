import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-session";

// "View as client": Craefto sees a client's portal exactly as they do, read
// only. Opening it (an admin-only route) sets VIEW_COOKIE to the account's id.
// The portal honours it only alongside a valid admin session, reads with the
// service role scoped to that account, and every action refuses to write.

export const VIEW_COOKIE = "craefto_view_as";
export const VIEW_SECONDS = 60 * 60 * 2;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What every action answers while viewing as a client. */
export const PREVIEW_REFUSAL = "You're viewing as this client, so nothing is sent or changed.";

/** The account Craefto is viewing the portal as: only with a valid admin session. */
export async function viewingAs(): Promise<string | null> {
  const store = await cookies();
  const id = store.get(VIEW_COOKIE)?.value;
  if (!id || !UUID.test(id)) return null;
  return (await verifyAdminSession(store.get(ADMIN_COOKIE)?.value)) ? id : null;
}
