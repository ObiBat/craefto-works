import { Fragment, type CSSProperties } from "react";

/**
 * The home hero's headline, played once as the page opens: the first words
 * type themselves out behind a sage caret, then each verb rises into place in
 * green and hands the colour on to the next, until it comes to rest on the
 * full stop.
 *
 * Pure CSS (see "Hero headline" in globals.css), so it plays from the first
 * paint, before hydration and without JavaScript, waits for the logo intro
 * (html.intro-delay), and shows the finished line at once with reduced
 * motion. Assistive tech reads the sentence from the heading's label.
 */

const STEP = 34; // between keystrokes, in ms
const SPACE = 34; // added between words
const PAUSE = 260; // the caret waits before the first verb
const VERB = 280; // between the first two verbs rising
const BEFORE_AND = 300;
const AND_STEP = 46;
const BEFORE_LAST = 140;
const DOT = 440; // the full stop lands as the last verb settles
const INK = 120; // a verb's green hands on as the next one rises

/** A steady but not mechanical rhythm: the same small variations every time. */
const jitter = (n: number) => ((n * 37) % 13) - 6;

interface Key {
  char: string;
  /** When it appears, in ms from the start. */
  at: number;
  /** How long the caret stays after it. */
  until: number;
}

function typeWords(words: string[], start: number, step: number) {
  let t = start;
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

function Verb({ text, rise, ink, dot }: { text: string; rise: number; ink: number; dot?: { at: number; blink: number } }) {
  return (
    <span className="hl-mask">
      <span className="hl-rise" style={{ "--t": ms(rise) } as CSSProperties}>
        <span className="hl-ink" style={{ "--k": ms(ink) } as CSSProperties}>
          {text}
        </span>
        {dot && (
          <span className="hl-dot" style={{ "--t": ms(dot.at), "--b": ms(dot.blink) } as CSSProperties}>
            .
          </span>
        )}
      </span>
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
  /** The three verbs that rise in, in order. */
  verbs: [string, string, string];
  className?: string;
}) {
  const sentence = `${lead} ${verbs[0]}, ${verbs[1]} and ${verbs[2]}.`;

  // The timeline, in ms from the start.
  const opening = typeWords(lead.split(" "), 0, STEP);
  const first = opening.end + PAUSE;
  const second = first + VERB;
  const and = typeWords(["and"], second + BEFORE_AND, AND_STEP);
  const third = and.end + BEFORE_LAST;
  const dot = third + DOT;
  // The caret waits after each typed run until the next verb rises.
  opening.last.until = first - opening.last.at;
  and.last.until = third - and.last.at;

  return (
    <h1 className={className} aria-label={sentence}>
      <span className="hl" aria-hidden="true">
        {opening.words.map((keys, i) => (
          <Fragment key={i}>
            <Typed keys={keys} />{" "}
          </Fragment>
        ))}
        <Verb text={`${verbs[0]},`} rise={first} ink={second + INK} />{" "}
        <Verb text={verbs[1]} rise={second} ink={third + INK} />{" "}
        <Typed keys={and.words[0]} />{" "}
        <Verb text={verbs[2]} rise={third} ink={dot + 160} dot={{ at: dot, blink: dot + 180 }} />
      </span>
    </h1>
  );
}
