import { Fragment, type CSSProperties } from "react";

/**
 * The home hero's headline: "We build how businesses" types itself out behind
 * a sage caret, then the line below tells the rest of the sentence a phrase
 * at a time, in a loop: "look," then "communicate" then "and operate.", each
 * verb rising into place in green as the last lifts away.
 *
 * Pure CSS (see "Hero headline" in globals.css), so it plays from the first
 * paint, before hydration and without JavaScript, and waits for the logo
 * intro (html.intro-delay). With reduced motion the whole sentence shows,
 * still. Screen readers and search read the sentence from the hidden copy.
 */

const STEP = 34; // between keystrokes, in ms
const SPACE = 34; // added between words
const PAUSE = 260; // the caret waits before the first verb

/** A steady but not mechanical rhythm: the same small variations every time. */
const jitter = (n: number) => ((n * 37) % 13) - 6;

interface Key {
  char: string;
  /** When it appears, in ms from the start. */
  at: number;
  /** How long the caret stays after it. */
  until: number;
}

function typeWords(words: string[], step: number) {
  let t = 0;
  let n = 0;
  const typed: Key[][] = words.map((word, w) => {
    const keys = [...word].map((char) => {
      const key = { char, at: t, until: 0 };
      t += step + jitter(n++);
      return key;
    });
    if (w < words.length - 1) t += SPACE;
    return keys;
  });
  const flat = typed.flat();
  flat.forEach((key, i) => {
    key.until = (flat[i + 1]?.at ?? t) - key.at;
  });
  return { words: typed, last: flat[flat.length - 1], end: t };
}

const ms = (value: number) => Math.round(value);

function Typed({ keys }: { keys: Key[] }) {
  return (
    <span className="hl-word">
      {keys.map((key, i) => (
        <span key={i} className="hl-c" style={{ "--t": ms(key.at), "--dt": ms(key.until) } as CSSProperties}>
          {key.char}
        </span>
      ))}
    </span>
  );
}

export function HeroHeadline({
  lead,
  verbs,
  className,
}: {
  /** The words typed out: "We build how businesses". */
  lead: string;
  /** The verbs that take turns on the line below, punctuated as the sentence
      reads (hl-cycle in globals.css is timed for three). */
  verbs: [string, string, string];
  className?: string;
}) {
  const sentence = `${lead} ${verbs[0]}, ${verbs[1]} and ${verbs[2]}.`;
  const opening = typeWords(lead.split(" "), STEP);
  const first = opening.end + PAUSE;
  // The caret waits after the last key until the first verb rises.
  opening.last.until = first - opening.last.at;

  return (
    <h1 className={className}>
      <span className="sr-only">{sentence}</span>
      <span className="hl" aria-hidden="true">
        {opening.words.map((keys, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <Typed keys={keys} />
          </Fragment>
        ))}
        {/* With reduced motion, the rest of the sentence, still. */}
        <span className="hl-still">
          {` ${verbs[0]}, ${verbs[1]} and ${verbs[2]}`}
          <span className="hl-stop">.</span>
        </span>
        <span className="hl-slot" style={{ "--first": ms(first) } as CSSProperties}>
          <span className="hl-verb" style={{ "--i": 0 } as CSSProperties}>
            {verbs[0]},
          </span>
          <span className="hl-verb" style={{ "--i": 1 } as CSSProperties}>
            {verbs[1]}
          </span>
          <span className="hl-verb" style={{ "--i": 2 } as CSSProperties}>
            <span className="hl-and">and </span>
            {verbs[2]}.
          </span>
        </span>
      </span>
    </h1>
  );
}
