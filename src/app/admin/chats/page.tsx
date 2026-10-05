"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState, FilterBar, FilterChip, PageHeader, StatusBadge } from "@/components/admin/ui";
import type { ChatSummary } from "@/lib/assistant/store";

// Ask Craefto's conversations: which became enquiries, what people asked,
// and the questions the site couldn't answer.

const VIEWS = [
  { id: "all", label: "All chats" },
  { id: "leads", label: "Became leads" },
  { id: "gaps", label: "Unanswered questions" },
] as const;
type View = (typeof VIEWS)[number]["id"];

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

const STATUS: Record<ChatSummary["status"], { label: string; variant: "neutral" | "success" | "accent" }> = {
  open: { label: "Browsing", variant: "neutral" },
  enquiry: { label: "Enquiry", variant: "success" },
  handoff: { label: "Wants a person", variant: "accent" },
};

export default function ChatsPage() {
  const [chats, setChats] = React.useState<ChatSummary[] | null>(null);
  const [error, setError] = React.useState("");
  const [view, setView] = React.useState<View>("all");

  React.useEffect(() => {
    fetch("/api/admin/chats", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        setChats(data.chats);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <EmptyState title="Couldn't load chats" description={error} />;
  if (!chats) return <AdminLoader message="Loading chats..." />;

  const rows = chats.filter((chat) => (view === "leads" ? chat.leadId : view === "gaps" ? chat.gaps.length > 0 : true));
  const gaps = chats.reduce((total, chat) => total + chat.gaps.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Chats" subtitle={`${chats.length} conversations with Ask Craefto · ${chats.filter((chat) => chat.leadId).length} became leads · ${gaps} unanswered questions`} />
      <FilterBar>
        {VIEWS.map((v) => (
          <FilterChip key={v.id} active={v.id === view} onClick={() => setView(v.id)}>
            {v.label}
          </FilterChip>
        ))}
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title={view === "gaps" ? "No unanswered questions" : view === "leads" ? "No chats have become leads yet" : "No chats yet"} />
      ) : (
        <ul className="divide-y divide-[hsl(var(--color-border))]/40 overflow-hidden rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50">
          {rows.map((chat) => (
            <li key={chat.id}>
              <Link href={`/admin/chats/${chat.id}`} className="block px-4 py-4 transition-colors hover:bg-[hsl(var(--color-background-muted))]/50 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium text-[hsl(var(--color-foreground))]">{chat.firstQuestion ?? "(No message)"}</p>
                  <StatusBadge variant={STATUS[chat.status].variant}>{STATUS[chat.status].label}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-[hsl(var(--color-foreground-subtle))]">
                  {when(chat.updatedAt)} · {chat.turns} message{chat.turns === 1 ? "" : "s"}
                  {chat.page ? ` · from ${chat.page}` : ""}
                  {chat.blocked ? ` · price check stepped in ${chat.blocked}×` : ""}
                </p>
                {view === "gaps" && chat.gaps.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-[hsl(var(--color-foreground))]">
                    {chat.gaps.map((gap) => (
                      <li key={gap}>“{gap}”</li>
                    ))}
                  </ul>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
