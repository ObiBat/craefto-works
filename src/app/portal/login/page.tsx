import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/forms";
import { PageTitle } from "@/components/portal/page-title";
import { currentMember } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sent?: string; expired?: string; signed_out?: string }>;
}) {
  if (await currentMember()) redirect("/portal");
  const { email, sent, expired, signed_out: signedOut } = await searchParams;

  return (
    <div className="mx-auto max-w-lg py-4 md:py-10">
      {sent ? (
        <PageTitle eyebrow="Client portal" title="Check your email">
          <p>
            If {email ? <strong className="font-medium text-[hsl(var(--color-foreground))]">{email}</strong> : "that address"} has a
            Craefto plan, a sign-in link is on its way. It works once and expires in an hour.
          </p>
          <p className="mt-4 text-base">
            Nothing yet? Check your spam folder, or{" "}
            <Link href={`/portal/login?email=${encodeURIComponent(email ?? "")}`} className="font-medium text-[hsl(var(--color-accent))] hover:underline">
              send another link
            </Link>
            .
          </p>
        </PageTitle>
      ) : (
        <>
          <PageTitle eyebrow="Client portal" title="Sign in">
            <p>
              {expired
                ? "That link has expired or was already used. Enter your email and we'll send a fresh one."
                : signedOut
                  ? "You're signed out. Come back any time."
                  : "Enter the email you subscribed with and we'll send you a link to sign in. There's no password to remember."}
            </p>
          </PageTitle>
          <div className="rounded-3xl bg-[hsl(var(--color-background-subtle))] p-6 md:p-8">
            <LoginForm email={email} />
          </div>
        </>
      )}
      <p className="mt-10 text-sm text-[hsl(var(--color-foreground-subtle))]">
        Not a client yet?{" "}
        <Link href="/services#plans" className="font-medium text-[hsl(var(--color-accent))] hover:underline">
          See the monthly plans
        </Link>
      </p>
    </div>
  );
}
