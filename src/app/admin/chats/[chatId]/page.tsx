"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { UIMessage } from "ai";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { DetailSection, EmptyState } from "@/components/admin/ui";
import { IconChevronLeft } from "@/components/admin/icons";
import type { ChatRow } from "@/lib/assistant/store";

// One Ask Craefto conversation as the visitor saw it, with what it led to.

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** What a tool step did, in a line. */
function toolLine(part: { type: string; state?: string; input?: Record<string, unknown>; output?: Record<string, unknown>; approval?: { approved?: boolean } }) {
  const name = part.type.replace(/^tool-/, "");
  const input = part.input ?? {};
  const outcome =
    part.state === "output-denied" || part.approval?.approved === false
      ? "declined by the visitor"
      : part.state === "approval-requested"
        ? "waiting for the visitor to confirm"
        : part.output && part.output.ok === false
          ? `not filed: ${String(part.output.error ?? "")}`
          : part.state === "output-available"
            ? "done"
            : (part.state ?? "");
  switch (name) {
    case "fileEnquiry":
      return `Enquiry card for ${String(input.name ?? "")} <${String(input.email ?? "")}>: ${outcome}`;
    case "talkToPerson":
      return `Asked for a person (${String(input.name ?? "")} <${String(input.email ?? "")}>): ${outcome}`;
    case "showBooking":
      return "Showed the Discovery Call booking button";
    case "noteUnanswered":
      return `Couldn't answer: “${String(input.question ?? "")}”`;
    default:
      return `${name}: ${outcome}`;
  }
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [chat, setChat] = React.useState<ChatRow | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/admin/chats/${chatId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        setChat(data.chat);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [chatId]);

  if (error) return <EmptyState title="Couldn't open this chat" description={error} />;
  if (!chat) return <AdminLoader message="Loading chat..." />;

  const messages = chat.messages as UIMessage[];
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <Link href="/admin/chats" className="inline-flex min-h-11 items-center gap-1 rounded-xl pr-3 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
        <IconChevronLeft size={16} /> Chats
      </Link>
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[hsl(var(--color-foreground))]">Ask Craefto chat</h1>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
          Started {when(chat.created_at)}
          {chat.page ? ` on ${chat.page}` : ""} · {chat.turns} visitor message{chat.turns === 1 ? "" : "s"}
          {chat.newsletter ? " · joined the journal" : ""}
        </p>
        {chat.lead_id && (
          <Link href={`/admin/leads/${chat.lead_id}`} className="inline-block text-sm font-medium text-[hsl(var(--color-accent))] hover:underline">
            {chat.status === "handoff" ? "Asked for a person: open the lead" : "Became an enquiry: open the lead"} →
          </Link>
        )}
      </header>

      <DetailSection title="Conversation">
        <ol className="space-y-4">
          {messages.map((message) => (
            <li key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
              <div className={message.role === "user" ? "max-w-[85%] rounded-2xl bg-[hsl(var(--color-foreground))] px-4 py-2.5 text-[hsl(var(--color-background))]" : "space-y-2"}>
                {message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <p key={index} className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                      {part.text}
                    </p>
                  ) : part.type.startsWith("tool-") ? (
                    <p key={index} className="rounded-lg bg-[hsl(var(--color-background-muted))] px-3 py-2 text-xs text-[hsl(var(--color-foreground-muted))]">
                      {toolLine(part as Parameters<typeof toolLine>[0])}
                    </p>
                  ) : part.type === "data-replies" ? (
                    <p key={index} className="text-xs text-[hsl(var(--color-foreground-muted))]">
                      One-tap replies offered: {((part as { data?: { options?: string[] } }).data?.options ?? []).join(" · ")}
                    </p>
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ol>
      </DetailSection>

      {chat.gaps.length > 0 && (
        <DetailSection title="Questions it couldn't answer">
          <ul className="space-y-1.5 text-sm text-[hsl(var(--color-foreground))]">
            {chat.gaps.map((gap) => (
              <li key={gap}>“{gap}”</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[hsl(var(--color-foreground-subtle))]">Worth covering on the site: the assistant only knows what the pages say.</p>
        </DetailSection>
      )}

      {chat.blocked.length > 0 && (
        <DetailSection title="What the price check replaced">
          <ul className="space-y-1.5 text-sm text-[hsl(var(--color-foreground))]">
            {chat.blocked.map((sentence, index) => (
              <li key={index}>“{sentence}”</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[hsl(var(--color-foreground-subtle))]">The visitor saw a line saying Obi would confirm the price instead.</p>
        </DetailSection>
      )}
    </div>
  );
}
