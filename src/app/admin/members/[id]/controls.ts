// The member page's form controls and API call, shared by its panels (page.tsx, billing.tsx).

export const field =
  "w-full px-4 py-2 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/50";
export const primary =
  "px-4 py-2 bg-[hsl(var(--color-accent))] text-white text-sm font-medium rounded-xl hover:bg-[hsl(var(--color-accent-hover))] transition-colors disabled:opacity-50";
export const secondary =
  "px-3 py-1.5 text-sm font-medium rounded-xl bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-accent-subtle))] transition-colors disabled:opacity-50";

/** Today in Sydney, yyyy-mm-dd. */
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** An admin API call: its JSON, or the error it explains. */
export async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "That didn't save. Try again.");
  return data;
}
