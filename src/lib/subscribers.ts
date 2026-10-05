import "server-only";
import { createServerClient } from "@/lib/supabase";
import { resend, EMAIL_FROM, isEmailEnabled } from "@/lib/resend";
import { SubscriptionWelcomeEmail, getSubscriptionWelcomeSubject } from "@/emails/subscription-welcome";

// The journal's mailing list: the subscribe form (api/subscribe) and the
// website assistant's opt-in both join it here. Single opt-in, with a welcome
// email that carries the unsubscribe link.

export type SubscribeResult = "already" | "resubscribed" | "confirmed" | "subscribed" | "failed";

async function sendWelcomeEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.craefto.com";
  const unsubscribeUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${token}`;
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: getSubscriptionWelcomeSubject(),
      html: SubscriptionWelcomeEmail({ unsubscribeUrl }),
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

/** Adds an address to the journal list (or brings it back), and welcomes it. */
export async function subscribeToJournal(rawEmail: string, source: string): Promise<SubscribeResult> {
  const email = rawEmail.trim().toLowerCase();
  const supabase = createServerClient();
  const { data: existing } = await supabase.from("journal_subscribers").select("id, status, confirmation_token").eq("email", email).single();

  if (existing) {
    if (existing.status === "confirmed") return "already";
    if (existing.status === "unsubscribed") {
      const { error } = await supabase
        .from("journal_subscribers")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString(), unsubscribed_at: null })
        .eq("id", existing.id);
      if (error) {
        console.error("Failed to re-subscribe:", error);
        return "failed";
      }
      if (isEmailEnabled()) await sendWelcomeEmail(email, existing.confirmation_token);
      return "resubscribed";
    }
    // Pending: confirm them now.
    const { error } = await supabase.from("journal_subscribers").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) console.error("Failed to confirm subscriber:", error);
    return "confirmed";
  }

  const confirmationToken = crypto.randomUUID();
  const { error } = await supabase.from("journal_subscribers").insert({
    email,
    status: "confirmed",
    confirmation_token: confirmationToken,
    confirmed_at: new Date().toISOString(),
    source,
  });
  if (error) {
    console.error("Failed to create subscriber:", error);
    return "failed";
  }
  if (isEmailEnabled()) await sendWelcomeEmail(email, confirmationToken);
  return "subscribed";
}
