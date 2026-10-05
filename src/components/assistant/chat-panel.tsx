"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { AssistantTools } from "@/lib/assistant/agent";
import { BUDGETS, ENQUIRY_GROUPS, ENQUIRY_UNSURE, TIMELINES } from "@/lib/enquiry";
import { BookCall } from "@/components/book-call";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";

// The Ask Craefto panel (loaded only when someone opens it). The browser
// sends the visitor's new message, or their answer on a confirmation card;
// the server keeps the transcript (api/assistant). Enquiries are filed only
// after the visitor confirms the summary card.

type ChatMessage = UIMessage<unknown, UIDataTypes, InferUITools<AssistantTools>>;
type Part = ChatMessage["parts"][number];

const STORAGE_KEY = "ask-craefto-chat";
const MAX_CHARS = 1000;

const SUGGESTIONS = ["What does a website cost?", "How does a project run?", "I have a project in mind"];

const SERVICE_LABELS = new Map<string, string>([...ENQUIRY_GROUPS.flatMap((group) => group.types.map((type) => [type.value, type.label] as const)), [ENQUIRY_UNSURE.value, ENQUIRY_UNSURE.label]]);
const label = (list: { value: string; label: string }[], value?: string | null) => (value ? (list.find((entry) => entry.value === value)?.label ?? value) : null);

/** The journal box on the summary card the visitor just answered (one panel per page). */
let newsletterChoice = false;

/** Sends the visitor's new message, or only their answers after a confirmation card: the server has the rest. */
const transport = new DefaultChatTransport<ChatMessage>({
  api: "/api/assistant",
  prepareSendMessagesRequest({ id, messages }) {
    const last = messages.at(-1);
    const page = window.location.pathname;
    if (last?.role === "user") return { body: { id, message: last, page } };
    const approvals = (last?.parts ?? []).flatMap((part) => {
      const approval = (part as { state?: string; approval?: { id: string; approved?: boolean } }).approval;
      return (part as { state?: string }).state === "approval-responded" && approval ? [{ approvalId: approval.id, approved: approval.approved === true }] : [];
    });
    return { body: { id, approvals, newsletter: newsletterChoice, page } };
  },
});

/** A random v4 UUID: the chat's only key to its transcript, so never anything guessable. */
function newChatId() {
  const webCrypto: Crypto = globalThis.crypto;
  // randomUUID needs a secure context; getRandomValues works everywhere.
  if (typeof webCrypto.randomUUID === "function") return webCrypto.randomUUID();
  const bytes = webCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function storedChatId() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberChatId(id: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private browsing: the chat just won't survive a reload.
  }
}

/** The server's refusal, in its own words when it gave some. */
function errorText(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // not JSON
  }
  return /fetch|network/i.test(error.message) ? "The connection dropped. Check you're online and try again." : "Something went wrong on our side. Try again, or email hello@craefto.com.";
}

function Facts({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
      {rows
        .filter(([, value]) => value)
        .map(([name, value]) => (
          <div key={name} className="contents">
            <dt className="text-[hsl(var(--color-foreground-muted))]">{name}</dt>
            <dd className="min-w-0 break-words text-[hsl(var(--color-foreground))]">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-4 rounded-2xl bg-[hsl(var(--color-accent-subtle))] p-4 text-[hsl(var(--color-foreground))]", className)}>{children}</div>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{children}</p>;
}

/** A confirmation card's two buttons. */
function Decide({ confirm, onConfirm, onDecline, busy }: { confirm: string; onConfirm: () => void; onDecline: () => void; busy: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={onConfirm} disabled={busy}>
        {confirm}
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={onDecline} disabled={busy}>
        Change something
      </Button>
    </div>
  );
}

function ToolPart({ part, busy, respond }: { part: Part; busy: boolean; respond: (approvalId: string, approved: boolean, newsletter?: boolean) => void }) {
  const [newsletter, setNewsletter] = useState(false);

  if (part.type === "tool-fileEnquiry") {
    const input = part.input;
    if (part.state === "input-streaming" || part.state === "input-available") return <Note>Putting your enquiry together…</Note>;
    if (part.state === "approval-requested" && input) {
      return (
        <Card>
          <p className="font-medium">Send this to Obi?</p>
          <Facts
            rows={[
              ["Name", input.name],
              ["Email", input.email],
              ["Company", input.company],
              ["About", (input.service && SERVICE_LABELS.get(input.service)) ?? input.service],
              ["Budget", label(BUDGETS, input.budget)],
              ["Timeline", label(TIMELINES, input.timeline)],
            ]}
          />
          <p className="rounded-xl bg-[hsl(var(--color-background))] px-3 py-2.5 text-sm leading-relaxed">{input.summary}</p>
          <label className="flex items-start gap-2.5 text-sm text-[hsl(var(--color-foreground-muted))]">
            <input type="checkbox" className="mt-0.5 size-4 accent-[hsl(var(--color-accent))]" checked={newsletter} onChange={(event) => setNewsletter(event.target.checked)} />
            <span>Also send me the Craefto journal (occasional, unsubscribe any time)</span>
          </label>
          <Note>
            Obi reads every enquiry and replies by email within one to two business days. We keep this chat with your enquiry (<Link href="/privacy#assistant" className="underline underline-offset-2">privacy</Link>).
          </Note>
          <Decide confirm="Send to Obi" busy={busy} onConfirm={() => respond(part.approval.id, true, newsletter)} onDecline={() => respond(part.approval.id, false)} />
        </Card>
      );
    }
    if (part.state === "approval-responded") return <Note>{part.approval.approved ? "Sending…" : "Not sent."}</Note>;
    if (part.state === "output-denied") return <Note>Not sent.</Note>;
    if (part.state === "output-error") return <Note>That didn&apos;t send. Try again, or email hello@craefto.com.</Note>;
    if (part.state === "output-available") {
      const output = part.output;
      if (!output.ok) return <Note>Not sent: {output.error}</Note>;
      return (
        <Card>
          <p>
            <span className="font-medium">Sent.</span> Obi has your enquiry and will reply by email within one to two business days. If you&apos;d like to talk it through, the Discovery Call is free and takes 30 minutes.
          </p>
          <BookCall name={output.name} email={output.email} project={input?.summary} size="sm" variant="default">
            Book the Discovery Call
          </BookCall>
        </Card>
      );
    }
    return null;
  }

  if (part.type === "tool-talkToPerson") {
    const input = part.input;
    if (part.state === "input-streaming" || part.state === "input-available") return <Note>Getting that ready for Obi…</Note>;
    if (part.state === "approval-requested" && input) {
      return (
        <Card>
          <p className="font-medium">Pass this to Obi?</p>
          <Facts
            rows={[
              ["Name", input.name],
              ["Email", input.email],
            ]}
          />
          <p className="rounded-xl bg-[hsl(var(--color-background))] px-3 py-2.5 text-sm leading-relaxed">{input.about}</p>
          <Note>
            Obi replies by email within one to two business days. We keep this chat with your message (<Link href="/privacy#assistant" className="underline underline-offset-2">privacy</Link>).
          </Note>
          <Decide confirm="Send to Obi" busy={busy} onConfirm={() => respond(part.approval.id, true)} onDecline={() => respond(part.approval.id, false)} />
        </Card>
      );
    }
    if (part.state === "approval-responded") return <Note>{part.approval.approved ? "Sending…" : "Not sent."}</Note>;
    if (part.state === "output-denied") return <Note>Not sent.</Note>;
    if (part.state === "output-error") return <Note>That didn&apos;t send. Try again, or email hello@craefto.com.</Note>;
    if (part.state === "output-available") {
      return part.output.ok ? (
        <Card>
          <p>
            <span className="font-medium">Sent.</span> Obi has your message and will reply by email within one to two business days.
          </p>
        </Card>
      ) : (
        <Note>Not sent: {part.output.error}</Note>
      );
    }
    return null;
  }

  if (part.type === "tool-showBooking" && part.state === "output-available") {
    const output = part.output;
    return (
      <BookCall name={output.name ?? undefined} email={output.email ?? undefined} project={output.project ?? undefined} size="sm" variant="default">
        Book the free Discovery Call
      </BookCall>
    );
  }

  return null;
}

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [chatId] = useState(() => storedChatId() ?? newChatId());
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  const { messages, sendMessage, status, error, stop, addToolApprovalResponse, setMessages, clearError } = useChat<ChatMessage>({
    id: chatId,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const busy = status === "submitted" || status === "streaming";

  // A chat that was going before a reload comes back.
  useEffect(() => {
    rememberChatId(chatId);
    let live = true;
    fetch(`/api/assistant?id=${chatId}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ messages: ChatMessage[] }>) : null))
      .then((data) => {
        if (live && data?.messages.length) setMessages(data.messages);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [chatId, setMessages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Follow the answer as it arrives, unless the visitor has scrolled up to read.
  useEffect(() => {
    const log = logRef.current;
    if (log && pinned.current) log.scrollTop = log.scrollHeight;
  }, [messages, status]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      clearError();
      pinned.current = true;
      void sendMessage({ text: trimmed.slice(0, MAX_CHARS) });
      setInput("");
    },
    [busy, clearError, sendMessage],
  );

  const respond = useCallback(
    (approvalId: string, approved: boolean, newsletter = false) => {
      newsletterChoice = approved && newsletter;
      pinned.current = true;
      void addToolApprovalResponse({ id: approvalId, approved });
      // The card's buttons go away: keep the keyboard in the panel.
      inputRef.current?.focus();
    },
    [addToolApprovalResponse],
  );

  // Escape closes the panel, from anywhere in it, or when focus has fallen back to the page.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const active = document.activeElement;
      if (!active || active === document.body || panelRef.current?.contains(active)) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(input);
    }
  };

  // Grow the box with what's typed, up to about five lines.
  useEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 140)}px`;
  }, [input]);

  return (
    <section
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="ask-craefto-title"
      hidden={!open}
      className="ask-craefto-panel fixed inset-0 z-50 flex flex-col bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-3xl sm:shadow-2xl sm:shadow-black/15"
    >
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-5">
        <div>
          {/* Sized inline: the site's global h2 scale isn't in a CSS layer, so it beats utility classes. */}
          <h2 id="ask-craefto-title" style={{ fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.01em" }}>
            Ask Craefto
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[hsl(var(--color-foreground-muted))]">AI assistant</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Ask Craefto"
          className="grid size-11 shrink-0 place-items-center rounded-full text-[hsl(var(--color-foreground-muted))] transition-colors hover:bg-[hsl(var(--color-background-muted))] hover:text-[hsl(var(--color-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-busy={busy}
        aria-label="Conversation"
        onScroll={(event) => {
          const log = event.currentTarget;
          pinned.current = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
        }}
        className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-4 text-[15px] leading-relaxed"
      >
        <div className="space-y-3">
          <p>
            Hi, I&apos;m Craefto&apos;s AI assistant. I can answer questions about our work, prices and process, or pass your project to Obi, who reads every enquiry.
          </p>
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="min-h-10 rounded-full bg-[hsl(var(--color-background-muted))] px-4 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--color-accent-subtle))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[hsl(var(--color-foreground))] px-4 py-2.5 text-[hsl(var(--color-background))]">
                <span className="sr-only">You: </span>
                {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
              </p>
            </div>
          ) : (
            <div key={message.id} className="space-y-3">
              <span className="sr-only">Ask Craefto: </span>
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  part.text.trim() ? <RichText key={index} text={part.text} /> : null
                ) : part.type.startsWith("tool-") ? (
                  <ToolPart key={index} part={part} busy={busy} respond={respond} />
                ) : null,
              )}
            </div>
          ),
        )}

        {status === "submitted" && (
          <p className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
            <span className="inline-flex gap-1" aria-hidden="true">
              <span className="ask-craefto-dot size-1.5 rounded-full bg-current" />
              <span className="ask-craefto-dot size-1.5 rounded-full bg-current [animation-delay:150ms]" />
              <span className="ask-craefto-dot size-1.5 rounded-full bg-current [animation-delay:300ms]" />
            </span>
            Thinking
          </p>
        )}
        {error && (
          <div role="alert" className="space-y-2 rounded-2xl bg-[hsl(var(--color-error-subtle))] px-4 py-3 text-sm">
            <p>{errorText(error)}</p>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex items-end gap-2 rounded-3xl bg-[hsl(var(--color-background-muted))] p-1.5 pl-4 focus-within:ring-2 focus-within:ring-[hsl(var(--color-accent))]/40">
          <label htmlFor="ask-craefto-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="ask-craefto-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about our work, prices or your project"
            // The rounded field shows focus; the global :focus-visible outline would draw a second box inside it.
            style={{ outline: "none" }}
            className="max-h-[140px] min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-6 text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label="Stop the answer"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] focus-visible:ring-offset-2"
            >
              <span aria-hidden="true" className="size-3 rounded-[3px] bg-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] transition-opacity disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] focus-visible:ring-offset-2"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-2 px-2 text-[12px] leading-snug text-[hsl(var(--color-foreground-subtle))]">
          AI can make mistakes: Obi confirms prices and dates. Don&apos;t share passwords or payment details.{" "}
          <Link href="/privacy#assistant" className="underline underline-offset-2">
            Privacy
          </Link>
          {pathname === "/contact" ? null : (
            <>
              {" · "}
              <Link href="/contact" className="underline underline-offset-2">
                Contact form
              </Link>
            </>
          )}
        </p>
      </form>
    </section>
  );
}
