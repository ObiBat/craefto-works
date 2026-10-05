// Where an answer flowing in (chat-panel.tsx, FlowingText) may stop: at the
// end of a word, and never partway through Markdown that RichText renders,
// so a frame never shows a stray ** or half a link.

/** Pieces that appear whole: a bold phrase, a link, an address, and a list item's marker with its first word or bold phrase. */
const WHOLE = /\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s)<>]+|^[ \t]*(?:\d+[.)]|[-*•])[ \t]+(?:\*\*[^*\n]+\*\*\S*|\S+)/gm;

/** How much of an answer can show once `position` characters are due: up to the last whole word, never inside a piece that must appear whole. */
export function shownUpTo(text: string, position: number) {
  if (position >= text.length) return text.length;
  let stop = 0;
  for (const word of text.matchAll(/\S+/g)) {
    const end = (word.index ?? 0) + word[0].length;
    if (end > position) break;
    stop = end;
  }
  for (const piece of text.matchAll(WHOLE)) {
    const start = piece.index ?? 0;
    if (start >= stop) break;
    if (start + piece[0].length > stop) return start;
  }
  return stop;
}

/** The first point an answer can show up to: its first word, or the whole first piece if it opens with one. */
export function firstStop(text: string) {
  const word = /^\s*\S+/.exec(text);
  if (!word) return text.length;
  const stop = shownUpTo(text, word[0].length);
  if (stop > 0) return stop;
  const piece = new RegExp(WHOLE.source, "m").exec(text);
  return piece ? (piece.index ?? 0) + piece[0].length : word[0].length;
}
