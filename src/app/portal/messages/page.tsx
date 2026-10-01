import type { Metadata } from "next";
import { MessageForm } from "@/components/portal/forms";
import { PageTitle } from "@/components/portal/page-title";
import { Thread } from "@/components/portal/thread";
import { requireMember } from "@/lib/portal/session";
import type { ClientFile, ClientMessage } from "@/lib/portal/types";

export const metadata: Metadata = { title: "Messages" };

/** The general conversation with Craefto (each request has its own on its page). */
export default async function MessagesPage() {
  const { account, db } = await requireMember();
  const [{ data }, { data: fileRows }] = await Promise.all([
    db.from("client_messages").select("*").eq("account_id", account.id).is("request_id", null).order("created_at"),
    db.from("client_files").select("*").eq("account_id", account.id).is("request_id", null).not("message_id", "is", null),
  ]);
  const messages = (data ?? []) as ClientMessage[];
  const files = (fileRows ?? []) as ClientFile[];

  return (
    <div className="max-w-3xl">
      <PageTitle title="Messages">
        <p>A direct line to the Craefto team: questions, ideas, feedback. For a specific request, write on its page so everything stays together.</p>
        <p className="mt-3 text-base">We&apos;ll email you at {account.email} whenever we reply.</p>
      </PageTitle>
      <Thread messages={messages} files={files} empty="No messages yet. Say hello, ask a question or share an idea." />
      <div className="mt-6">
        <MessageForm placeholder="Write to the Craefto team, or attach files…" />
      </div>
    </div>
  );
}
