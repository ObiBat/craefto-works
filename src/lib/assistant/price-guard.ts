import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";
import { figuresIn } from "./knowledge";

// The price check (plan: "a check after each answer blocks any dollar figure
// that isn't on it"). The assistant's answer streams a sentence at a time:
// each is checked when it ends, and every currency figure in it must be one
// the site publishes. A sentence with one that isn't is replaced whole by an
// honest line, so an invented price never reaches the visitor, even for a
// moment, and never leaves half a sentence behind. Em dashes become commas
// on the way, as in the site's own copy.

export const UNPUBLISHED_PRICE = "I can't give you a figure for that here. Obi will confirm the exact price with you, as a fixed price before any work starts.";

/** The currency figures in a text that aren't published. */
export function unpublished(text: string, allowed: Set<number>): number[] {
  return figuresIn(text).filter((figure) => !allowed.has(figure));
}

/** Where the first sentence in the text ends (after its closing punctuation and space), or -1. */
function sentenceEnd(text: string) {
  const match = /[.!?]["')\]]?(?=\s)|\n/.exec(text);
  if (!match) return -1;
  let end = match.index + match[0].length;
  while (end < text.length && /[ \t]/.test(text[end])) end++;
  return end;
}

/** A sentence this long with no number in it yet streams on, rather than keeping the visitor waiting. */
const LONG_SENTENCE = 320;

/**
 * The stream transform. `onBlocked` hears each sentence it replaced, for the
 * record. Sentences are released whole, once checked.
 */
export function priceGuard<TOOLS extends ToolSet>(allowed: Set<number>, onBlocked?: (sentence: string) => void): StreamTextTransform<TOOLS> {
  return () => {
    const pending = new Map<string, string>();
    const checked = (raw: string) => {
      // The site's own punctuation: no em dashes.
      const sentence = raw.replace(/\s*\u2014\s*/g, ", ").replace(/ ,/g, ",");
      if (!unpublished(sentence, allowed).length) return sentence;
      onBlocked?.(sentence);
      const space = sentence.match(/\s*$/)?.[0] ?? "";
      return `${UNPUBLISHED_PRICE}${space || " "}`;
    };
    const delta = (id: string, text: string): TextStreamPart<TOOLS> => ({ type: "text-delta", id, text });

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        if (chunk.type === "text-delta") {
          let buffer = (pending.get(chunk.id) ?? "") + chunk.text;
          // Release every finished sentence, checked.
          for (let end = sentenceEnd(buffer); end > 0; end = sentenceEnd(buffer)) {
            controller.enqueue(delta(chunk.id, checked(buffer.slice(0, end))));
            buffer = buffer.slice(end);
          }
          // An unfinished sentence waits for its end, unless it runs long with no number in it.
          if (buffer.length > LONG_SENTENCE && !/\d|\$/.test(buffer)) {
            const cut = buffer.search(/\s\S*$/);
            if (cut > 0) {
              controller.enqueue(delta(chunk.id, buffer.slice(0, cut + 1)));
              buffer = buffer.slice(cut + 1);
            }
          }
          pending.set(chunk.id, buffer);
          return;
        }
        if (chunk.type === "text-end") {
          const rest = pending.get(chunk.id);
          if (rest) controller.enqueue(delta(chunk.id, checked(rest)));
          pending.delete(chunk.id);
        }
        controller.enqueue(chunk);
      },
      flush(controller) {
        for (const [id, rest] of pending) if (rest) controller.enqueue(delta(id, checked(rest)));
        pending.clear();
      },
    });
  };
}
