import type { ReactNode } from "react";

// The assistant's answers, rendered from the little Markdown it writes:
// paragraphs, lists, bold and links. Only links to craefto.com and the
// booking calendar become links; anything else stays plain text, so an
// answer can't send a visitor somewhere unexpected.

const ALLOWED_HOSTS = new Set(["www.craefto.com", "craefto.com", "cal.com"]);

function safeHref(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_HOSTS.has(parsed.hostname) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const INLINE = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)<>]+[^\s)<>.,;:!?'"])/g;

function link(href: string, text: string, key: number) {
  const internal = new URL(href).hostname.endsWith("craefto.com");
  return (
    <a
      key={key}
      href={href}
      {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className="font-medium text-[hsl(var(--color-accent))] underline decoration-[hsl(var(--color-accent))]/30 underline-offset-2 hover:decoration-[hsl(var(--color-accent))]"
    >
      {text}
    </a>
  );
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    if (match[1]) nodes.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
    else if (match[2] && match[3]) {
      const href = safeHref(match[3]);
      nodes.push(href ? link(href, match[2], key++) : match[2]);
    } else if (match[4]) {
      const href = safeHref(match[4]);
      nodes.push(href ? link(href, match[4].replace(/^https:\/\/(www\.)?/, ""), key++) : match[4]);
    }
    last = at + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block = { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

function blocks(text: string): Block[] {
  const result: Block[] = [];
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const last = result.at(-1);
    if (!line) {
      result.push({ kind: "p", lines: [] });
    } else if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)![1];
      if (last && last.kind === kind) last.items.push(item);
      else result.push({ kind, items: [item] });
    } else {
      const heading = line.replace(/^#{1,6}\s+/, "");
      if (last && last.kind === "p" && last.lines.length) last.lines.push(heading);
      else result.push({ kind: "p", lines: [heading] });
    }
  }
  return result.filter((block) => (block.kind === "p" ? block.lines.length > 0 : block.items.length > 0));
}

export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {blocks(text).map((block, index) =>
        block.kind === "p" ? (
          <p key={index}>
            {block.lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        ) : block.kind === "ul" ? (
          <ul key={index} className="list-disc space-y-1 pl-5 marker:text-[hsl(var(--color-foreground-subtle))]">
            {block.items.map((item, i) => (
              <li key={i}>{inline(item)}</li>
            ))}
          </ul>
        ) : (
          <ol key={index} className="list-decimal space-y-1 pl-5 marker:text-[hsl(var(--color-foreground-subtle))]">
            {block.items.map((item, i) => (
              <li key={i}>{inline(item)}</li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
