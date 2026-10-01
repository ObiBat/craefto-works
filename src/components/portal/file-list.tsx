import { formatBytes } from "@/lib/portal/file-rules";
import type { ClientFile } from "@/lib/portal/types";
import { FileIcon } from "./file-icon";

/** Shared files as download chips. `href` gives each file's download link. */
export function FileList({ files, href, className }: { files: ClientFile[]; href: (file: ClientFile) => string; className?: string }) {
  if (files.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ""}`} aria-label="Files">
      {files.map((file) => (
        <li key={file.id} className="max-w-full">
          <a
            href={href(file)}
            className="group flex max-w-full items-center gap-2 rounded-xl bg-[hsl(var(--color-background))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] transition-colors hover:text-[hsl(var(--color-accent))]"
          >
            <FileIcon name={file.name} className="h-4 w-4 shrink-0 text-[hsl(var(--color-foreground-subtle))] group-hover:text-[hsl(var(--color-accent))]" />
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-xs text-[hsl(var(--color-foreground-subtle))]">{formatBytes(file.size)}</span>
            <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
