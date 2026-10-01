import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { claimWelcome, createSignIn, provisionCheckout } from "@/lib/portal/accounts";
import { CHECKOUT_COOKIE, currentMember, portalDb } from "@/lib/portal/session";

/**
 * Where Stripe Checkout returns a client. Their account is set up from the
 * completed session (the webhook does the same and sends the emails, so
 * whichever runs first is fine). A new client is signed straight in: on the
 * first visit, in the browser that started the checkout (CHECKOUT_COOKIE),
 * when this checkout made their account. Anyone can type an existing
 * client's email into Checkout, so paying with one never opens that portal:
 * like a second visit or the link opened elsewhere, it goes to sign-in.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) redirect("/portal/login");

  let result: Awaited<ReturnType<typeof provisionCheckout>> = null;
  for (const attempt of [1, 2]) {
    try {
      result = await provisionCheckout(sessionId);
      break;
    } catch (error) {
      // Once more after a moment: the webhook may be setting up the same account.
      if (attempt === 2) console.error("Setting up a client from Checkout failed:", error);
      else await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!result) redirect("/portal/login");
  const { account } = result;

  const member = await currentMember();
  if (member?.account.id === account.id) redirect("/portal?welcome=1");

  const store = await cookies();
  const thisBrowser = store.get(CHECKOUT_COOKIE)?.value === sessionId;
  if (thisBrowser) store.set(CHECKOUT_COOKIE, "", { path: "/portal/welcome", maxAge: 0 });
  if (thisBrowser && account.created_by_checkout === sessionId && (await claimWelcome(account, sessionId))) {
    const signIn = await createSignIn(account);
    const { error } = await (await portalDb()).auth.verifyOtp({ token_hash: signIn.tokenHash, type: signIn.type });
    if (!error) redirect("/portal?welcome=1");
    console.error("Signing a new client in failed:", error);
  }
  // The address is only filled in for the browser that paid.
  redirect(thisBrowser ? `/portal/login?email=${encodeURIComponent(account.email)}` : "/portal/login");
}
