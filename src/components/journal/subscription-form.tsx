"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type FormStatus = "idle" | "loading" | "success" | "error" | "already_subscribed";

function SubscriptionFormInner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();

  // Check for confirmation redirect
  useEffect(() => {
    const subscribed = searchParams.get("subscribed");
    const already = searchParams.get("already");
    const error = searchParams.get("error");

    if (subscribed === "true") {
      setStatus(already === "true" ? "already_subscribed" : "success");
    } else if (error) {
      setStatus("error");
      setErrorMessage(
        error === "invalid_token"
          ? "Invalid or expired confirmation link."
          : "Something went wrong. Please try again."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "journal_page" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      if (data.alreadySubscribed) {
        setStatus("already_subscribed");
      } else {
        setStatus("success");
      }
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-[hsl(var(--color-foreground))] font-medium mb-2">
          You&apos;re subscribed!
        </p>
        <p className="text-[hsl(var(--color-foreground-muted))] text-sm">
          Welcome to the Craefto Journal. Check your inbox for a welcome email.
        </p>
      </div>
    );
  }

  if (status === "already_subscribed") {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-[hsl(var(--color-foreground))] font-medium mb-2">
          You&apos;re already subscribed
        </p>
        <p className="text-[hsl(var(--color-foreground-muted))] text-sm">
          Thanks for being part of the Craefto community.
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-5 py-3.5 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] focus:border-transparent transition-shadow disabled:opacity-50"
          required
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-7 py-3.5 rounded-xl bg-[hsl(var(--color-accent))] text-white font-medium hover:opacity-90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Subscribing...
            </span>
          ) : (
            "Subscribe"
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-sm mt-3 text-center">{errorMessage}</p>
      )}
      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-4">
        No spam, unsubscribe anytime.
      </p>
    </>
  );
}

export function SubscriptionForm() {
  return (
    <Suspense fallback={<SubscriptionFormSkeleton />}>
      <SubscriptionFormInner />
    </Suspense>
  );
}

function SubscriptionFormSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto animate-pulse">
      <div className="flex-1 h-[52px] rounded-xl bg-[hsl(var(--color-background-subtle))]" />
      <div className="w-32 h-[52px] rounded-xl bg-[hsl(var(--color-accent))]/50" />
    </div>
  );
}
