import { redirect } from "next/navigation";
import { portalDb } from "@/lib/portal/session";

/** Sign the client out (a form posts here, so a link or prefetch can't). */
export async function POST() {
  await (await portalDb()).auth.signOut();
  redirect("/portal/login?signed_out=1");
}
