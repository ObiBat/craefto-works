"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type InferUITools, type UIMessage } from "ai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { AssistantTools } from "@/lib/assistant/agent";
import { pauseSmoothScroll } from "@/lib/smooth-scroll";
import { BUDGETS, ENQUIRY_GROUPS, ENQUIRY_UNSURE, TIMELINES } from "@/lib/enquiry";
import { BookCall } from "@/components/book-call";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { firstStop, shownUpTo } from "./reveal";
import { RichText } from "./rich-text";

// The Ask Craefto panel (loaded only when someone opens it). The browser
// sends the visitor's new message, or their answer on a confirmation card;
// the server keeps the transcript (api/assistant). Enquiries are filed only
// after the visitor confirms the summary card.

/** The one-tap replies under an answer arrive as a data part (agent.ts withReplies). */
type ChatData = { replies: { options: string[] } };
type ChatMessage = UIMessage<unknown, ChatData, InferUITools<AssistantTools>>;
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
    <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm leading-5 [@media(max-height:600px)]:gap-y-0.5">
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

/**
 * A card in the conversation. Given the id of its title, it's a named group:
 * a confirmation card, which sits a little closer on short screens (an
 * iPhone SE's, under Safari's bars) so it still fits whole.
 */
function Card({ children, className, labelledBy }: { children: React.ReactNode; className?: string; labelledBy?: string }) {
  return (
    <div
      role={labelledBy ? "group" : undefined}
      aria-labelledby={labelledBy}
      className={cn(
        "space-y-3 rounded-2xl bg-[hsl(var(--color-accent-subtle))] p-4 text-[hsl(var(--color-foreground))]",
        labelledBy && "[@media(max-height:600px)]:space-y-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{children}</p>;
}

/** A confirmation card's small print. */
function Fine({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-[18px] text-[hsl(var(--color-foreground-muted))]">{children}</p>;
}

/** A confirmation card's two buttons, side by side down to a 375px-wide phone. */
function Decide({ confirm, onConfirm, onDecline, busy }: { confirm: string; onConfirm: () => void; onDecline: () => void; busy: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" className="px-4" onClick={onConfirm} disabled={busy}>
        {confirm}
      </Button>
      <Button type="button" size="sm" variant="secondary" className="px-4" onClick={onDecline} disabled={busy}>
        Change something
      </Button>
    </div>
  );
}

/** One-tap replies: the visitor's likely next message, sent as it is when tapped. They sit on the visitor's side, where the reply will appear. */
function Chips({ options, onPick, label }: { options: string[]; onPick: (text: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-end gap-2 pl-6">
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          onClick={() => onPick(option)}
          style={{ animationDelay: `${120 + index * 60}ms` }}
          className="ask-craefto-chip min-h-11 rounded-full sm:min-h-10 bg-[hsl(var(--color-background-muted))] px-4 py-2 text-left text-sm transition-[background-color,scale] duration-150 hover:bg-[hsl(var(--color-accent-subtle))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] active:scale-[0.97]"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ToolPart({ part, busy, respond }: { part: Part; busy: boolean; respond: (approvalId: string, approved: boolean, newsletter?: boolean) => void }) {
  const [newsletter, setNewsletter] = useState(false);
  const titleId = useId();

  if (part.type === "tool-fileEnquiry") {
    const input = part.input;
    if (part.state === "input-streaming" || part.state === "input-available") return <Note>Putting your enquiry together…</Note>;
    if (part.state === "approval-requested" && input) {
      return (
        <Card labelledBy={titleId}>
          <p id={titleId} className="font-medium">
            Send this to Craefto Works?
          </p>
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
          <p className="rounded-xl bg-[hsl(var(--color-background))] px-3 py-2 text-sm leading-5">{input.summary}</p>
          <label className="flex items-start gap-2.5 text-[13px] leading-[18px] text-[hsl(var(--color-foreground-muted))]">
            <input type="checkbox" className="mt-px size-4 shrink-0 accent-[hsl(var(--color-accent))]" checked={newsletter} onChange={(event) => setNewsletter(event.target.checked)} />
            <span>Also send me the Craefto journal (occasional, unsubscribe any time)</span>
          </label>
          <Fine>
            Craefto Works replies by email within one to two business days. We keep this chat with your enquiry (<Link href="/privacy#assistant" className="underline underline-offset-2">privacy</Link>).
          </Fine>
          <Decide confirm="Send enquiry" busy={busy} onConfirm={() => respond(part.approval.id, true, newsletter)} onDecline={() => respond(part.approval.id, false)} />
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
            <span className="font-medium">Sent.</span> Craefto Works has your enquiry and will reply by email within one to two business days. If you&apos;d like to talk it through, the Discovery Call is free and takes 30 minutes.
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
    if (part.state === "input-streaming" || part.state === "input-available") return <Note>Getting your message ready…</Note>;
    if (part.state === "approval-requested" && input) {
      return (
        <Card labelledBy={titleId}>
          <p id={titleId} className="font-medium">
            Send this to Craefto Works?
          </p>
          <Facts
            rows={[
              ["Name", input.name],
              ["Email", input.email],
            ]}
          />
          <p className="rounded-xl bg-[hsl(var(--color-background))] px-3 py-2 text-sm leading-5">{input.about}</p>
          <Fine>
            Craefto Works replies by email within one to two business days. We keep this chat with your message (<Link href="/privacy#assistant" className="underline underline-offset-2">privacy</Link>).
          </Fine>
          <Decide confirm="Send message" busy={busy} onConfirm={() => respond(part.approval.id, true)} onDecline={() => respond(part.approval.id, false)} />
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
            <span className="font-medium">Sent.</span> Craefto Works has your message and will reply by email within one to two business days.
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

// ── Answers flowing in ────────────────────────────────────────────────────

const stillMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * An answer's text as it streams. The price check releases whole sentences,
 * which would land in bursts; this lets them flow in a word at a time, at a
 * steady 200 or so characters a second and faster when the answer has run
 * ahead, so it never lags far behind. A finished answer (a reload, an older
 * message) shows whole, as does everything with reduced motion.
 */
function FlowingText({ text, live, flowKey, onFlow }: { text: string; live: boolean; flowKey: string; onFlow: (key: string, flowing: boolean) => void }) {
  // Mid-answer it opens on its first word, taking the thinking line's place without a blank moment.
  const [shown, setShown] = useState(() => (live && !stillMotion() ? firstStop(text) : text.length));
  // How far the reveal has got, in characters (fractional), kept across runs: each new sentence restarts the loop from here.
  const position = useRef(shown);

  useEffect(() => {
    if (position.current >= text.length) return;
    let last = 0;
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = last ? Math.min(64, now - last) : 16;
      last = now;
      const behind = text.length - position.current;
      position.current = Math.min(text.length, position.current + Math.max(0.2 * elapsed, behind * (1 - Math.exp(-elapsed / 300))));
      const stop = shownUpTo(text, position.current);
      setShown((current) => Math.max(current, stop));
      if (position.current < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  // The panel holds what follows (cards, replies) until the text has finished flowing.
  const flowing = shown < text.length;
  useEffect(() => onFlow(flowKey, flowing), [flowKey, flowing, onFlow]);
  useEffect(() => () => onFlow(flowKey, false), [flowKey, onFlow]);

  return <RichText text={text.slice(0, shown)} />;
}

/** Whether an answer has anything to show yet: words, or a card. */
const showsSomething = (message: ChatMessage) =>
  message.parts.some(
    (part) =>
      (part.type === "text" && part.text.trim().length > 0) ||
      part.type === "tool-fileEnquiry" ||
      part.type === "tool-talkToPerson" ||
      (part.type === "tool-showBooking" && part.state === "output-available"),
  );

/** Whether an answer ends on a summary card still waiting for the visitor to send it or change it. */
const awaitsAnswer = (message: ChatMessage | undefined) =>
  message?.role === "assistant" && message.parts.some((part) => "state" in part && part.state === "approval-requested");

/** The replies the latest answer suggests. */
function suggestionsOf(message: ChatMessage | undefined): string[] {
  if (message?.role !== "assistant") return [];
  // A summary card waits for an answer of its own: no suggestions beside it.
  if (awaitsAnswer(message)) return [];
  const last = message.parts.findLast((part) => part.type === "data-replies");
  return last?.type === "data-replies" ? last.data.options : [];
}

/**
 * Where focus goes inside the open panel: the message box where there's a
 * mouse, or the panel itself on touch screens, so the keyboard doesn't cover
 * the conversation and its one-tap replies until the visitor asks for it.
 * The panel too while a summary card has the box's place.
 */
function focusInside(panel: HTMLElement | null, input: HTMLTextAreaElement | null) {
  if (window.matchMedia("(pointer: fine)").matches && input && !input.form?.hidden) input.focus();
  else panel?.focus({ preventScroll: true });
}

export default function ChatPanel({ state, onClose, onClosed }: { state: "open" | "closing" | "closed"; onClose: () => void; onClosed: () => void }) {
  const open = state !== "closed";

  // Closing ends when the exit animation does (onAnimationEnd below): at once with reduced motion, and a fallback should it never run.
  useEffect(() => {
    if (state !== "closing") return;
    const timer = setTimeout(onClosed, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500);
    return () => clearTimeout(timer);
  }, [state, onClosed]);
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
  const replies = status === "ready" ? suggestionsOf(messages.at(-1)) : [];
  // A summary card waiting for an answer takes the message box's place, so
  // the whole card fits in view (and a phone's keyboard gets out of its way).
  const awaiting = awaitsAnswer(messages.at(-1));
  const panelRef = useRef<HTMLElement>(null);

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

  // Opening lands on the latest message.
  useEffect(() => {
    if (!open) return;
    pinned.current = true;
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    focusInside(panelRef.current, inputRef.current);
  }, [open]);

  // Follow the conversation's end as it grows, gliding rather than jumping,
  // unless the visitor has scrolled up to read. Only their own scrolling
  // (wheel, touch, keys, the scrollbar) decides that, never the glide's.
  const contentRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(0);
  const markUserScroll = () => {
    userScrolled.current = performance.now();
  };
  useEffect(() => {
    const log = logRef.current;
    const content = contentRef.current;
    if (!log || !content) return;
    let frame = 0;
    const glide = () => {
      if (frame || !pinned.current) return;
      let last = 0;
      // Eases to the end in about a quarter of a second, whatever the screen's frame rate.
      const step = (now: number) => {
        frame = 0;
        const elapsed = last ? Math.min(64, now - last) : 16;
        last = now;
        const gap = log.scrollHeight - log.clientHeight - log.scrollTop;
        if (!pinned.current || gap <= 1) return;
        log.scrollTop += stillMotion() || gap < 2 ? gap : Math.max(1, gap * (1 - Math.exp(-elapsed / 90)));
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    // The conversation growing, or the panel shrinking (a growing message box, a phone's keyboard).
    const observer = new ResizeObserver(glide);
    observer.observe(content);
    observer.observe(log);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  // Phones: the sheet fills just what's visible above the keyboard (the
  // visual viewport), so nothing slides about or shows through when it
  // opens, and the page behind holds still, as it does under the menu.
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 639px)").matches) return;
    const panel = panelRef.current;
    const viewport = window.visualViewport;
    const html = document.documentElement;
    document.body.style.overflow = "hidden";
    html.classList.add("ask-craefto-open");
    pauseSmoothScroll(true);
    const fit = () => {
      if (!panel || !viewport) return;
      panel.style.setProperty("--viewport-height", `${viewport.height}px`);
      panel.style.setProperty("--viewport-top", `${viewport.offsetTop}px`);
      panel.dataset.keyboard = window.innerHeight - viewport.height > 120 ? "open" : "closed";
    };
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    return () => {
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
      document.body.style.overflow = "";
      html.classList.remove("ask-craefto-open");
      pauseSmoothScroll(false);
      panel?.style.removeProperty("--viewport-height");
      panel?.style.removeProperty("--viewport-top");
      delete panel?.dataset.keyboard;
    };
  }, [open]);

  // Which answers are still flowing in (FlowingText): what follows them waits.
  const [flowingKeys, setFlowingKeys] = useState<string[]>([]);
  const onFlow = useCallback((key: string, flowing: boolean) => {
    setFlowingKeys((keys) => (flowing ? (keys.includes(key) ? keys : [...keys, key]) : keys.includes(key) ? keys.filter((entry) => entry !== key) : keys));
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      clearError();
      pinned.current = true;
      // The box empties as the message appears in the conversation, never after.
      setInput("");
      void sendMessage({ text: trimmed.slice(0, MAX_CHARS) });
    },
    [busy, clearError, sendMessage],
  );

  const respond = useCallback(
    (approvalId: string, approved: boolean, newsletter = false) => {
      newsletterChoice = approved && newsletter;
      pinned.current = true;
      void addToolApprovalResponse({ id: approvalId, approved });
    },
    [addToolApprovalResponse],
  );

  // The card and the message box take turns. Once the card is answered, and
  // its buttons go, focus returns to the box; while it waits, focus that was
  // in the box (now gone) stays in the panel.
  const wasAwaiting = useRef(false);
  useEffect(() => {
    if (awaiting === wasAwaiting.current) return;
    wasAwaiting.current = awaiting;
    if (!open) return;
    const active = document.activeElement;
    if (!awaiting || !panelRef.current?.contains(active) || active === inputRef.current) focusInside(panelRef.current, inputRef.current);
  }, [awaiting, open]);

  // A tapped reply goes as it is; the replies give way to it, so focus stays in the panel.
  const pick = useCallback(
    (text: string) => {
      send(text);
      focusInside(panelRef.current, inputRef.current);
    },
    [send],
  );
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

  // Sent while an answer is still finishing (its one-tap replies take a moment): it goes as soon as the answer is done,
  // or, if the answer was a summary card, once the card has been answered.
  const sendWhenReady = useRef(false);
  useEffect(() => {
    if (status !== "ready" || awaiting || !sendWhenReady.current) return;
    const timer = setTimeout(() => {
      sendWhenReady.current = false;
      send(inputRef.current?.value ?? "");
    }, 0);
    return () => clearTimeout(timer);
  }, [status, awaiting, send]);

  const submitTyped = () => {
    if (busy) sendWhenReady.current = Boolean(input.trim());
    else send(input);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitTyped();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitTyped();
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
      data-state={state}
      onAnimationEnd={(event) => {
        if (state === "closing" && event.target === event.currentTarget) onClosed();
      }}
      tabIndex={-1}
      // Focused itself only on touch screens (focusInside), where a ring round the whole panel would be noise.
      style={{ outline: "none" }}
      className="ask-craefto-panel fixed inset-0 z-50 flex flex-col text-[hsl(var(--color-foreground))] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-3xl"
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
        aria-busy={busy || flowingKeys.length > 0}
        aria-label="Conversation"
        onScroll={(event) => {
          const log = event.currentTarget;
          const below = log.scrollHeight - log.scrollTop - log.clientHeight;
          if (performance.now() - userScrolled.current < 400) pinned.current = below < 48;
          // Soft edges where the conversation runs on out of view (globals.css).
          log.dataset.above = String(log.scrollTop > 2);
          log.dataset.below = String(below > 2);
        }}
        onWheel={markUserScroll}
        onTouchMove={markUserScroll}
        onKeyDown={markUserScroll}
        onPointerDown={(event) => {
          // The scrollbar itself.
          if (event.target === event.currentTarget) markUserScroll();
        }}
        // The page's smooth scrolling leaves the conversation to scroll on its own.
        data-lenis-prevent
        className={cn(
          "ask-craefto-log flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-1 text-[15px] leading-relaxed",
          // In place of the message box's own padding, which clears a phone's home bar.
          awaiting && "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div ref={contentRef} className="space-y-5">
          <div className="space-y-3">
            <p>
              Hi, I&apos;m Craefto&apos;s AI assistant. I can answer questions about our work, prices and process, or pass your project to Craefto Works, where a person reads every enquiry.
            </p>
            {messages.length === 0 && <Chips options={SUGGESTIONS} onPick={pick} label="Ways to start" />}
          </div>

          {messages.map((message, index) => {
            if (message.role === "user") {
              return (
                <div key={message.id} className="ask-craefto-message flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[hsl(var(--color-foreground))] px-4 py-2.5 text-[hsl(var(--color-background))]">
                    <span className="sr-only">You: </span>
                    {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
                  </p>
                </div>
              );
            }
            const latest = index === messages.length - 1;
            // Until it has words or a card, the thinking line below stands in for it, in its place.
            if (latest && busy && !showsSomething(message)) return null;
            let held = false;
            return (
              <div key={message.id} className="ask-craefto-answer space-y-3">
                <span className="sr-only">Ask Craefto: </span>
                {message.parts.map((part, partIndex) => {
                  if (held) return null;
                  const key = `${message.id}:${partIndex}`;
                  if (part.type === "text") {
                    if (!part.text.trim()) return null;
                    held = flowingKeys.includes(key);
                    return <FlowingText key={partIndex} text={part.text} live={latest && busy} flowKey={key} onFlow={onFlow} />;
                  }
                  return part.type.startsWith("tool-") ? <ToolPart key={partIndex} part={part} busy={busy} respond={respond} /> : null;
                })}
              </div>
            );
          })}

          {replies.length > 0 && flowingKeys.length === 0 && <Chips options={replies} onPick={pick} label="Suggested replies" />}

          {busy && !(messages.at(-1)?.role === "assistant" && showsSomething(messages.at(-1)!)) && (
            <p className="ask-craefto-thinking flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))]">
              <span className="inline-flex gap-1" aria-hidden="true">
                <span className="ask-craefto-dot size-1.5 rounded-full bg-current" />
                <span className="ask-craefto-dot size-1.5 rounded-full bg-current [animation-delay:150ms]" />
                <span className="ask-craefto-dot size-1.5 rounded-full bg-current [animation-delay:300ms]" />
              </span>
              Thinking
            </p>
          )}
          {error && (
            <div role="alert" className="ask-craefto-message space-y-2 rounded-2xl bg-[hsl(var(--color-error-subtle))] px-4 py-3 text-sm">
              <p>{errorText(error)}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} hidden={awaiting} className="ask-craefto-compose px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
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
            // 16px on phones: any smaller and iPhones zoom the page in when the box is tapped.
            className="max-h-[140px] min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base leading-6 sm:text-[15px] text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none"
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
          AI can make mistakes: Craefto Works confirms prices and dates. Don&apos;t share passwords or payment details.{" "}
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
