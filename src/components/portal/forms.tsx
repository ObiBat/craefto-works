"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRequest, prepareFileUploads, sendLoginLink, sendMessage, type FormState } from "@/app/portal/actions";
import { AttachButton, DropOverlay, UploadList, useAttachments, useFileDrop, type PrepareUploads } from "./attachments";

function Submit({ children, busy, uploading, className }: { children: React.ReactNode; busy: string; uploading?: boolean; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || uploading} aria-busy={pending} className={className}>
      {pending ? busy : uploading ? "Uploading…" : children}
    </Button>
  );
}

function FormError({ state }: { state: FormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="text-sm text-[hsl(var(--color-error))]">
      {state.error}
    </p>
  );
}

const label = "text-sm font-medium text-[hsl(var(--color-foreground))]";
const hint = "text-sm leading-relaxed text-[hsl(var(--color-foreground-subtle))]";
const prepare: PrepareUploads = (files) => prepareFileUploads({ files });

export function LoginForm({ email }: { email?: string }) {
  const [state, action] = useActionState(sendLoginLink, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label htmlFor="email" className={label}>
        Email
      </label>
      <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email ?? email} placeholder="you@company.com" />
      <FormError state={state} />
      <Submit busy="Sending…" className="w-full">Email me a sign-in link</Submit>
    </form>
  );
}

/** A new request: what's needed, the details, any files, and where updates will go. */
export function NewRequestForm({ email }: { email: string }) {
  const [state, action] = useActionState(createRequest, {});
  const attachments = useAttachments(prepare);
  const { over, dropProps } = useFileDrop(attachments.add);
  return (
    <form action={action} className="relative flex flex-col gap-8" {...dropProps}>
      <DropOverlay over={over} label="Drop files to add them to your request" />
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className={label}>
          What do you need?
        </label>
        <Input id="title" name="title" required maxLength={200} defaultValue={state.values?.title} placeholder="A landing page for the spring launch" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="details" className={label}>
          Details
        </label>
        <p id="details-hint" className={hint}>
          Goals, links, dates and examples you like. The more we know, the sooner we can start.
        </p>
        <Textarea id="details" name="details" rows={8} maxLength={10000} defaultValue={state.values?.details} aria-describedby="details-hint" />
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>Files</span>
        <p className={hint}>Briefs, brand assets or references. Drop them anywhere here, or choose them.</p>
        <div className="flex flex-col gap-3 rounded-2xl bg-[hsl(var(--color-background-subtle))] p-3">
          <div>
            <AttachButton onFiles={attachments.add} label="Choose files" />
          </div>
          <UploadList uploads={attachments.uploads} error={attachments.error} onRemove={attachments.remove} />
        </div>
      </div>
      <FormError state={state} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Submit busy="Sending…" uploading={attachments.busy}>
          Send request
        </Submit>
        <p className={hint}>
          We&apos;ll email you at <span className="font-medium text-[hsl(var(--color-foreground))]">{email}</span> whenever there&apos;s an update.
        </p>
      </div>
    </form>
  );
}

/** Write to Craefto, with files if need be: about a request, or in the general conversation. Clears once sent. */
export function MessageForm({ requestId, placeholder }: { requestId?: string; placeholder: string }) {
  const [state, action] = useActionState(sendMessage, {});
  const attachments = useAttachments(prepare);
  const { over, dropProps } = useFileDrop(attachments.add);
  const { clear } = attachments;
  // A fresh state without an error means the message went: start again.
  useEffect(() => {
    if (!state.error) clear();
  }, [state, clear]);

  return (
    <form action={action} className="relative flex flex-col gap-3" {...dropProps}>
      <DropOverlay over={over} />
      {requestId && <input type="hidden" name="request_id" value={requestId} />}
      <label htmlFor="body" className="sr-only">
        Message
      </label>
      <Textarea id="body" name="body" rows={4} maxLength={10000} defaultValue={state.values?.body} placeholder={placeholder} />
      <UploadList uploads={attachments.uploads} error={attachments.error} onRemove={attachments.remove} hint={false} />
      <FormError state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AttachButton onFiles={attachments.add} />
        <Submit busy="Sending…" uploading={attachments.busy}>
          Send
        </Submit>
      </div>
    </form>
  );
}
