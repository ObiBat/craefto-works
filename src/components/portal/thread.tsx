import { cn } from "@/lib/utils";
import type { ClientFile, ClientMessage } from "@/lib/portal/types";
import { RichText } from "@/components/assistant/rich-text";
import { FileList } from "./file-list";

/** Where a client downloads a shared file. */
export const portalFileHref = (file: ClientFile) => `/portal/files/${file.id}`;

export const sydneyDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : { year: "numeric" }),
    timeZone: "Australia/Sydney",
  });

/** A conversation, oldest first: Craefto's side on a soft green tint, Ask Craefto's on a lighter one, files under each message. */
export function Thread({ messages, files = [], empty }: { messages: ClientMessage[]; files?: ClientFile[]; empty: string }) {
  if (messages.length === 0) {
    return empty ? <p className="text-[hsl(var(--color-foreground-subtle))]">{empty}</p> : null;
  }
  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => {
        const ours = message.author !== "client";
        const assistant = message.author === "assistant";
        return (
          <li
            key={message.id}
            className={cn(
              "rounded-2xl px-5 py-4",
              assistant ? "portal-assistant mr-6 sm:mr-16" : ours ? "mr-6 bg-[hsl(var(--color-accent-subtle))] sm:mr-16" : "ml-6 bg-[hsl(var(--color-background-subtle))] sm:ml-16"
            )}
          >
            <p className="mb-2 flex items-baseline justify-between gap-4 font-mono text-[0.6875rem] uppercase tracking-[0.06em]">
              <span className={ours ? "text-[hsl(var(--color-accent))]" : "text-[hsl(var(--color-foreground-muted))]"}>
                {assistant ? "Ask Craefto · AI assistant" : ours ? "Craefto" : "You"}
              </span>
              <time dateTime={message.created_at} className="text-[hsl(var(--color-foreground-subtle))]">
                {sydneyDate(message.created_at, true)}
              </time>
            </p>
            {message.body &&
              (assistant ? (
                <div className="leading-relaxed text-[hsl(var(--color-foreground))]">
                  <RichText text={message.body} />
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-[hsl(var(--color-foreground))]">{message.body}</p>
              ))}
            <FileList
              files={files.filter((file) => file.message_id === message.id)}
              href={portalFileHref}
              className={message.body ? "mt-3" : undefined}
            />
          </li>
        );
      })}
    </ol>
  );
}
