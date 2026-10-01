"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCEPT, FILE_HINT, MAX_FILES, fileProblem, formatBytes } from "@/lib/portal/file-rules";
import { cn } from "@/lib/utils";
import { FileIcon } from "./file-icon";

/** Upload links for a batch of files (a server action in the portal, an API call in admin). */
export type PrepareUploads = (
  files: Array<{ name: string; size: number; type: string }>
) => Promise<{ slots?: Array<{ id: string; url: string }>; error?: string }>;

interface Upload {
  key: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "failed";
  id?: string;
}

/** Send a file to its one-time storage link, reporting progress. */
function put(url: string, file: File, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed"));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file, file.name);
    xhr.send(body);
  });
}

/**
 * Files attached to a form: picked or dropped, uploaded straight away, and
 * sent with the form as hidden "files" inputs once they've arrived.
 */
export function useAttachments(prepare: PrepareUploads) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);
  // How many are attached or on their way (kept in step for add(), which can run twice before a render).
  const count = useRef(0);
  useEffect(() => {
    count.current = uploads.filter((upload) => upload.status !== "failed").length;
  }, [uploads]);

  const update = (key: string, patch: Partial<Upload>) =>
    setUploads((current) => current.map((upload) => (upload.key === key ? { ...upload, ...patch } : upload)));

  const add = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list);
      if (files.length === 0) return;
      setError(null);
      if (count.current + files.length > MAX_FILES) return setError(`Attach up to ${MAX_FILES} files at a time.`);
      const problem = files.map(fileProblem).find(Boolean);
      if (problem) return setError(problem);

      const batch: Upload[] = files.map((file) => ({
        key: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
      }));
      count.current += batch.length;
      setUploads((current) => [...current, ...batch]);
      const result = await prepare(files.map((file) => ({ name: file.name, size: file.size, type: file.type })));
      if (!result.slots) {
        setUploads((current) => current.filter((upload) => !batch.some((item) => item.key === upload.key)));
        return setError(result.error ?? "Uploads aren't available just now. Please try again.");
      }
      await Promise.all(
        files.map(async (file, index) => {
          const { key } = batch[index];
          const slot = result.slots![index];
          try {
            await put(slot.url, file, (progress) => update(key, { progress }));
            update(key, { status: "done", progress: 1, id: slot.id });
          } catch {
            update(key, { status: "failed" });
          }
        })
      );
    },
    [prepare]
  );

  const remove = useCallback((key: string) => setUploads((current) => current.filter((upload) => upload.key !== key)), []);
  const clear = useCallback(() => {
    setUploads([]);
    setError(null);
  }, []);

  return {
    uploads,
    error,
    add,
    remove,
    clear,
    busy: uploads.some((upload) => upload.status === "uploading"),
    ids: uploads.flatMap((upload) => (upload.status === "done" && upload.id ? [upload.id] : [])),
  };
}

/** Drop files anywhere on an element (a form, say) to attach them. */
export function useFileDrop(onFiles: (files: FileList) => void) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes("Files");
  return {
    over,
    dropProps: {
      onDragEnter: (event: React.DragEvent) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      },
      onDragOver: (event: React.DragEvent) => hasFiles(event) && event.preventDefault(),
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      },
      onDrop: (event: React.DragEvent) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setOver(false);
        onFiles(event.dataTransfer.files);
      },
    },
  };
}

/** Shown over a form while files are dragged onto it (the form needs `relative`). */
export function DropOverlay({ over, label = "Drop files to attach" }: { over: boolean; label?: string }) {
  if (!over) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-2 z-10 grid place-items-center rounded-3xl bg-[hsl(var(--color-accent-subtle)/0.94)] text-sm font-medium text-[hsl(var(--color-accent))]"
    >
      {label}
    </div>
  );
}

const paperclip =
  "M15.17 7l-6.59 6.59a2 2 0 102.83 2.83l6.41-6.59a4 4 0 00-5.66-5.66l-6.4 6.58a6 6 0 108.48 8.49L20.5 13";

/** A quiet button that opens the file picker. */
export function AttachButton({ onFiles, disabled, label = "Attach files" }: { onFiles: (files: FileList) => void; disabled?: boolean; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[hsl(var(--color-foreground-muted))] transition-colors hover:bg-[hsl(var(--color-background-muted))] hover:text-[hsl(var(--color-foreground))] disabled:opacity-50"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={paperclip} />
        </svg>
        {label}
      </button>
    </>
  );
}

/** Files on their way, with progress; finished ones go with the form. */
export function UploadList({
  uploads,
  error,
  onRemove,
  hint = true,
}: {
  uploads: Upload[];
  error: string | null;
  onRemove: (key: string) => void;
  hint?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {uploads.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Attached files">
          {uploads.map((upload) => (
            <li
              key={upload.key}
              className={cn(
                "relative flex max-w-full items-center gap-2 overflow-hidden rounded-xl py-2 pl-3 pr-2 text-sm",
                upload.status === "failed"
                  ? "bg-[hsl(var(--color-error-subtle))] text-[hsl(var(--color-error))]"
                  : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))]"
              )}
            >
              {/* Progress fills the chip from the left. */}
              {upload.status === "uploading" && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-[hsl(var(--color-accent-subtle))] transition-[width] duration-200"
                  style={{ width: `${Math.round(upload.progress * 100)}%` }}
                />
              )}
              <span className="relative flex min-w-0 items-center gap-2">
                <FileIcon name={upload.name} className="h-4 w-4 shrink-0" />
                <span className="truncate">{upload.name}</span>
                <span className="shrink-0 text-xs text-[hsl(var(--color-foreground-subtle))]">
                  {upload.status === "uploading"
                    ? `${Math.round(upload.progress * 100)}%`
                    : upload.status === "failed"
                      ? "Didn't upload"
                      : formatBytes(upload.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(upload.key)}
                aria-label={`Remove ${upload.name}`}
                className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-[hsl(var(--color-foreground-subtle))] hover:bg-[hsl(var(--color-background-subtle))] hover:text-[hsl(var(--color-foreground))]"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {upload.status === "done" && upload.id && <input type="hidden" name="files" value={upload.id} />}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-[hsl(var(--color-error))]">
          {error}
        </p>
      )}
      {hint && uploads.length === 0 && !error && <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">{FILE_HINT}</p>}
    </div>
  );
}
