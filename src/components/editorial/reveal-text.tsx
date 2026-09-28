import { Fragment, type CSSProperties } from "react";

/**
 * Editorial text reveal: each word rises from its own baseline mask.
 *
 * mode="view" plays when the text scrolls into view; mode="load" plays on page
 * load and starts partly visible, so a headline still paints immediately.
 * The words stay real text (one copy), so assistive tech, copy and paste, and
 * search all read the plain sentence.
 * Without JavaScript, or with reduced motion, the text is simply shown.
 */
export function RevealText({
  text,
  mode = "view",
  delay = 0,
}: {
  text: string;
  mode?: "view" | "load";
  /** Offset the stagger by this many words. */
  delay?: number;
}) {
  const words = text.trim().split(/\s+/);
  return (
    <span data-reveal={mode === "view" ? "text" : undefined} data-reveal-load={mode === "load" ? "" : undefined} suppressHydrationWarning>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="rt-word">
            <span style={{ "--w": i + delay } as CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
