// What clients (and Craefto) can share in the portal. Used in the browser for
// instant feedback and on the server, where it's enforced; the storage
// bucket also caps each file at 25 MB (supabase/migrations/018).

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 10;

/** Briefs, images, design files, fonts, media and zips; nothing that runs. */
const ALLOWED = new Set([
  // Images
  "jpg", "jpeg", "png", "gif", "webp", "avif", "heic", "heif", "tif", "tiff", "bmp", "svg",
  // Documents
  "pdf", "doc", "docx", "rtf", "txt", "md", "csv", "xls", "xlsx", "ppt", "pptx", "key", "pages", "numbers", "odt", "ods", "odp",
  // Design
  "ai", "eps", "psd", "fig", "sketch", "xd", "indd", "afdesign", "afphoto", "afpub",
  // Fonts
  "otf", "ttf", "woff", "woff2",
  // Video and audio
  "mp4", "mov", "m4v", "webm", "mp3", "wav", "m4a", "aac",
  // Archives
  "zip",
]);

export const extensionOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

export const FILE_HINT = "Up to 10 files, 25 MB each. For anything bigger, share a link.";

/** For the file picker's accept attribute. */
export const ACCEPT = [...ALLOWED].map((extension) => `.${extension}`).join(",");

/** A rough kind, for the file's icon. */
export function fileKind(name: string): "image" | "video" | "audio" | "archive" | "document" {
  const extension = extensionOf(name);
  if (["jpg", "jpeg", "png", "gif", "webp", "avif", "heic", "heif", "tif", "tiff", "bmp", "svg"].includes(extension)) return "image";
  if (["mp4", "mov", "m4v", "webm"].includes(extension)) return "video";
  if (["mp3", "wav", "m4a", "aac"].includes(extension)) return "audio";
  if (extension === "zip") return "archive";
  return "document";
}

/** Why a file can't be shared, or null when it can. */
export function fileProblem(file: { name: string; size: number }): string | null {
  if (!ALLOWED.has(extensionOf(file.name))) return `${file.name} isn't a file type we accept. Zip it, or share a link.`;
  if (file.size <= 0) return `${file.name} is empty.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is over 25 MB. Share a link to it instead.`;
  return null;
}

/** "840 KB", "12.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
