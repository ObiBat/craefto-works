"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Newsreader, Shippori_Mincho } from "next/font/google";
import { MARK_A, MARK_T, MARK_TRANSFORM, MARK_V } from "./tav-mark-paths";

/**
 * Brand moments for case studies.
 *
 * Each client's own logo entrance, ported from its production codebase so the
 * case study shows the real choreography rather than a re-creation:
 *
 * - TAV & Partners: the three letters of the mark ink themselves in from the
 *   baseline in reading order, the rule draws out, then the name wipes in as
 *   if written. (tavpartners.com.au header, on load.)
 * - JapanoMa: the torii outline traces itself like a brush stroke, the house
 *   follows, then the ink floods the fills as the tracing stroke dissolves.
 *   (japanoma.com.au promise panel.)
 *
 * Both play once when scrolled into view and can be replayed with a tap.
 * Under prefers-reduced-motion the lockups are simply visible, fully inked.
 */

const newsreader = Newsreader({ subsets: ["latin"], weight: ["400"], display: "swap" });
const shippori = Shippori_Mincho({ subsets: ["latin"], weight: ["400"], display: "swap" });

// ---------------------------------------------------------------------------
// TAV & Partners
// ---------------------------------------------------------------------------

const TAV_NAVY = "#1b2344";
const TAV_RULE_REVERSED = "#41527a";
// Lockup geometry measured off the client's original artwork (see brand.tsx
// in the TAV repo): symbol 0..1000 wide, rule at y=414.2, name on 518.2.
const TAV = { ruleY: 414.2, ruleX2: 988.4, ruleH: 10.4, wordY: 518.2, wordW: 976.2, wordSize: 85, vbW: 1000, vbH: 530 };

function TavLockup({ play }: { play: boolean }) {
  const letters: [string, string][] = [
    [MARK_T, "cs-tav-letter-1"],
    [MARK_A, "cs-tav-letter-2"],
    [MARK_V, "cs-tav-letter-3"],
  ];
  return (
    <svg
      viewBox={`0 0 ${TAV.vbW} ${TAV.vbH}`}
      className={`${newsreader.className} w-full h-auto`}
      role="img"
      aria-label="TAV & Partners"
      focusable="false"
    >
      {/* Paint order follows the artwork: the V overlaps the A. Each animated
          wrapper carries no transform of its own, so the clip animation never
          overrides the artwork's positioning matrix. */}
      {letters.map(([d, cls]) => (
        <g key={cls} className={play ? `cs-tav-letter ${cls}` : undefined}>
          <g transform={MARK_TRANSFORM}>
            <path d={d} fill="#ffffff" />
          </g>
        </g>
      ))}
      <rect
        className={play ? "cs-tav-rule" : undefined}
        x="0"
        y={TAV.ruleY}
        width={TAV.ruleX2}
        height={TAV.ruleH}
        fill={TAV_RULE_REVERSED}
      />
      <g className={play ? "cs-tav-wordmark" : undefined}>
        {/* textLength forces the name to the symbol's width, as the original is set. */}
        <text
          x="0"
          y={TAV.wordY}
          textLength={TAV.wordW}
          lengthAdjust="spacing"
          fontSize={TAV.wordSize}
          fontWeight="400"
          fill="#ffffff"
          style={{ fontFamily: "inherit" }}
        >
          TAV &amp; PARTNERS
        </text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// JapanoMa
// ---------------------------------------------------------------------------

// Path data from the JapanoMa repo: [0] the torii arch, [1] the house.
const JP_PATHS: [string, string] = [
  "M155 7446 c-92 -43 -166 -190 -152 -304 3 -26 19 -88 35 -138 27 -80 41 -117 99 -254 81 -193 263 -506 381 -654 88 -111 100 -124 222 -247 314 -317 719 -571 1095 -686 140 -42 268 -65 670 -118 105 -14 217 -30 250 -35 33 -5 78 -11 100 -14 90 -10 484 -67 539 -77 72 -13 115 -40 150 -94 39 -62 56 -120 56 -189 -1 -115 -26 -189 -88 -253 -60 -61 -101 -69 -301 -55 -91 7 -224 12 -296 12 -71 0 -182 5 -245 10 -63 5 -205 10 -315 11 -223 2 -236 0 -294 -66 -38 -43 -56 -86 -72 -166 -10 -53 -9 -74 10 -172 26 -128 48 -192 86 -241 35 -46 101 -76 169 -76 67 0 93 -9 142 -52 49 -44 85 -126 92 -210 5 -77 -7 -138 -48 -223 -15 -33 -44 -94 -63 -135 -86 -187 -232 -501 -262 -565 -35 -73 -88 -187 -135 -290 -15 -33 -51 -109 -79 -168 -28 -60 -51 -110 -51 -112 0 -1 -23 -52 -51 -111 -73 -156 -117 -250 -149 -319 -15 -33 -43 -94 -62 -135 -20 -41 -47 -100 -61 -130 -14 -30 -44 -95 -67 -145 -23 -49 -55 -118 -70 -151 -42 -90 -107 -228 -150 -319 -92 -193 -170 -358 -170 -361 0 -2 -20 -45 -45 -97 -25 -52 -45 -100 -45 -106 0 -8 337 -11 1239 -11 l1240 0 6 57 c15 140 46 450 66 653 5 58 14 141 19 185 5 44 12 107 15 140 3 33 10 105 16 160 5 55 16 165 24 245 28 285 45 456 54 540 6 47 15 132 21 190 19 185 30 251 48 294 13 28 62 81 152 166 74 69 172 161 220 205 47 44 213 197 369 339 156 143 293 269 305 280 12 12 42 39 66 60 25 21 74 67 110 100 36 34 166 154 290 268 345 316 336 307 366 373 26 60 26 61 20 228 -9 212 1 255 79 333 44 45 58 52 101 58 27 3 355 8 729 12 749 7 714 10 787 -55 21 -18 47 -57 63 -95 29 -68 29 -89 9 -311 -7 -82 11 -159 53 -221 14 -21 89 -97 167 -167 77 -70 166 -151 197 -180 31 -29 76 -70 100 -92 67 -60 286 -261 359 -329 36 -34 86 -79 110 -100 44 -39 222 -201 264 -241 11 -11 152 -139 311 -284 160 -145 297 -273 306 -285 59 -76 69 -118 93 -376 9 -91 20 -203 25 -250 10 -88 23 -211 41 -385 5 -55 16 -163 24 -240 8 -77 20 -196 26 -265 6 -69 16 -149 21 -179 5 -30 9 -75 9 -99 0 -25 4 -73 9 -106 5 -34 15 -115 21 -181 7 -66 18 -175 26 -242 8 -67 14 -140 14 -162 l0 -41 1245 0 c1181 0 1244 1 1239 18 -9 26 -26 64 -89 197 -31 66 -85 181 -120 255 -35 74 -89 189 -120 255 -32 66 -70 147 -85 180 -15 33 -48 104 -74 157 -25 53 -59 125 -75 160 -16 35 -53 115 -84 178 -30 63 -69 147 -87 185 -18 39 -55 117 -82 175 -28 58 -63 132 -78 165 -15 33 -58 122 -94 198 -36 76 -66 139 -66 141 0 2 -33 72 -74 157 -40 85 -87 183 -103 219 -17 36 -68 144 -113 240 -45 96 -99 211 -120 255 -56 121 -63 148 -58 239 5 92 33 159 90 213 41 39 76 53 135 53 99 0 174 44 212 125 30 65 71 244 71 312 0 137 -72 257 -168 282 -36 10 -113 8 -925 -19 -363 -12 -360 -12 -427 52 -49 47 -73 110 -78 208 -5 99 16 169 69 233 50 60 75 68 284 88 104 10 233 23 285 29 301 35 616 92 825 150 44 12 94 25 110 30 58 16 190 58 235 75 564 213 946 491 1281 930 116 153 277 440 349 625 12 30 28 69 36 85 31 67 84 249 84 289 0 70 -44 192 -83 230 -78 75 -149 80 -277 19 -47 -22 -107 -51 -135 -63 -27 -12 -68 -31 -91 -41 -22 -10 -65 -27 -95 -39 -30 -11 -63 -24 -74 -29 -74 -33 -320 -120 -490 -175 -308 -98 -926 -268 -1160 -317 -27 -6 -66 -15 -85 -19 -255 -59 -702 -143 -955 -180 -33 -4 -107 -15 -165 -24 -131 -19 -404 -52 -625 -75 -93 -10 -140 -14 -430 -41 -222 -21 -772 -51 -1270 -70 -343 -13 -818 -13 -1145 0 -713 29 -773 32 -1210 66 -293 22 -401 33 -760 74 -259 30 -254 29 -400 51 -219 32 -287 43 -460 74 -47 8 -112 20 -145 26 -63 11 -133 25 -200 40 -22 4 -96 20 -165 35 -136 28 -590 138 -655 159 -22 7 -85 25 -140 39 -55 15 -111 31 -125 36 -14 5 -72 23 -130 40 -161 49 -323 100 -345 110 -11 5 -65 24 -120 43 -55 19 -139 53 -187 76 -48 22 -89 41 -92 41 -2 0 -46 20 -97 43 -52 24 -116 54 -144 67 -27 12 -77 35 -110 50 -33 15 -82 38 -110 50 -62 28 -130 35 -170 16z",
  "M6285 2184 c-189 -25 -258 -44 -400 -110 -224 -105 -420 -298 -529 -524 -44 -90 -62 -139 -89 -245 -19 -75 -20 -116 -24 -692 l-4 -613 1260 0 1261 0 0 578 c0 555 -3 625 -31 742 -81 332 -308 608 -624 759 -86 41 -134 57 -265 87 -63 14 -483 28 -555 18z",
];

const JP = { sumi: "#1A1816", washi: "#F5F0E8", ai: "#3D5A7A" };

function JapanomaLockup({ play }: { play: boolean }) {
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <svg
        viewBox="0 0 1301 748"
        className={`shrink-0 ${play ? "cs-jp-ink" : ""}`}
        style={{ color: JP.ai, height: "clamp(80px, 9vw, 112px)", width: "auto", aspectRatio: "1301 / 748", display: "block" }}
        role="img"
        aria-label="JapanoMa mark"
        focusable="false"
      >
        <g transform="translate(0 748) scale(0.1 -0.1)" fill="currentColor">
          {JP_PATHS.map((d, i) => (
            <path
              key={d.slice(0, 16)}
              d={d}
              pathLength={1}
              strokeWidth={250}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ "--ink-delay": `${i * 550}ms` } as React.CSSProperties}
            />
          ))}
        </g>
      </svg>
      <span
        className={`${shippori.className} ${play ? "cs-jp-wordmark" : ""} text-4xl sm:text-5xl leading-none tracking-[-0.01em]`}
        style={{ color: JP.sumi }}
        aria-hidden="true"
      >
        JapanoMa
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Artisan
// ---------------------------------------------------------------------------

// The nipper mark from brand/logo/artisan-mark-animated.svg in the Artisan
// repo: the jaws rotate about the rivet (256,195) and the ember dot pulses
// on the close. Runs as a loop, exactly as the source file does.
const ART = { ink0: "#26262B", ink1: "#151517", line: "#EDEDF1", bone: "#FAFAFA", ember: "#F97316" };

function ArtisanMark({ play }: { play: boolean }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className="w-full h-auto max-w-[280px]"
      role="img"
      aria-label="Artisan mark"
      focusable="false"
    >
      <defs>
        <linearGradient id="cs-art-bg" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor={ART.ink0} />
          <stop offset="1" stopColor={ART.ink1} />
        </linearGradient>
        <radialGradient id="cs-art-ember" cx="0.4" cy="0.35" r="0.85">
          <stop stopColor="#FDBA74" />
          <stop offset="0.42" stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#cs-art-bg)" stroke="#2A2A31" strokeWidth="2" />
      <g stroke={ART.line} strokeWidth="15" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className={play ? "cs-art-jaw-l" : undefined} d="M242 104 Q216 142 250 186" />
        <path className={play ? "cs-art-jaw-r" : undefined} d="M270 104 Q296 142 262 186" />
        <path d="M244 200 Q196 294 156 386" />
        <path d="M268 200 Q316 294 356 386" />
      </g>
      <circle cx="256" cy="195" r="21" fill="none" stroke={ART.line} strokeWidth="14" />
      <circle className={play ? "cs-art-rivet" : undefined} cx="256" cy="195" r="13.5" fill="url(#cs-art-ember)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

const COPY = {
  "tav-partners": {
    label: "Brand moment",
    title: "The mark inks itself in.",
    body: "On tavpartners.com.au the lockup introduces itself once per visit: the T with its swoosh, then the A, then the V settle in from the baseline, the rule draws out, and the name is written in. Nothing else on the site animates on scroll. For a practice selling steadiness, movement everywhere would undercut it.",
    replay: "Replay the entrance",
  },
  artisan: {
    label: "Brand moment",
    title: "The mark snips.",
    body: "Artisan's mark is a pair of steel-fixing nippers, the tool every fixer carries. In motion the jaws close about the rivet and the ember dot pulses on the snip, one three-second loop that lives in the app icon, the site and the deck. The ember is the identity's only accent.",
    replay: "Snip again",
  },
  japanoma: {
    label: "Brand moment",
    title: "A brush stroke, then the ink floods.",
    body: "The torii outline traces itself like a single stroke, the house follows through the gateway, and the ink floods the fills as the tracing line dissolves. Pure SVG and CSS, compositor-only, and fully inked from the first frame for anyone who prefers reduced motion.",
    replay: "Replay the stroke",
  },
} as const;

export type BrandMomentSlug = keyof typeof COPY;

export function BrandMoment({ slug }: { slug: BrandMomentSlug }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [run, setRun] = useState(0);
  const copy = COPY[slug];
  const isTav = slug === "tav-partners";
  const isArt = slug === "artisan";
  const dark = isTav || isArt;

  // Play once when at least half the panel is on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Remounting the lockup restarts its CSS animations.
  const replay = useCallback(() => setRun((n) => n + 1), []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border ${
        isTav ? "border-[#2a3358]" : isArt ? "border-[#2A2A31]" : "border-[hsl(var(--color-border))]"
      }`}
      style={{ background: isTav ? TAV_NAVY : isArt ? `linear-gradient(180deg, ${ART.ink0}, ${ART.ink1})` : JP.washi }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Stage */}
        <button
          type="button"
          onClick={replay}
          aria-label={copy.replay}
          className="lg:col-span-3 flex items-center justify-center px-8 py-14 sm:px-14 sm:py-20 lg:py-24 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
        >
          <div className={isTav ? "w-full max-w-[420px]" : "w-full max-w-[520px] flex justify-center"}>
            {inView ? (
              isTav ? <TavLockup key={run} play /> : isArt ? <ArtisanMark key={run} play /> : <JapanomaLockup key={run} play />
            ) : (
              <div className="invisible" aria-hidden="true">
                {isTav ? <TavLockup play={false} /> : isArt ? <ArtisanMark play={false} /> : <JapanomaLockup play={false} />}
              </div>
            )}
          </div>
        </button>

        {/* Copy */}
        <div
          className={`lg:col-span-2 flex flex-col justify-center gap-4 px-8 py-8 sm:px-10 lg:py-12 border-t lg:border-t-0 lg:border-l ${
            isTav ? "border-[#2a3358] text-white" : isArt ? "border-[#2A2A31] text-white" : "border-[hsl(var(--color-border))]"
          }`}
          style={dark ? undefined : { color: JP.sumi }}
        >
          <p className={`text-xs uppercase font-mono tracking-[0.06em] ${dark ? "text-white/60" : "text-[hsl(var(--color-foreground-subtle))]"}`}>
            {copy.label}
          </p>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: dark ? "#ffffff" : JP.sumi }}>{copy.title}</h3>
          <p className={`text-sm leading-relaxed ${dark ? "text-white/75" : "text-[hsl(var(--color-foreground-muted))]"}`}>
            {copy.body}
          </p>
          <button
            type="button"
            onClick={replay}
            className={`self-start inline-flex items-center gap-2 text-sm font-medium rounded-full border px-4 py-2 transition-colors ${
              dark
                ? "border-white/25 text-white hover:bg-white/10"
                : "border-[hsl(var(--color-border-strong))] hover:bg-[hsl(var(--color-background-muted))]"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0 1 18 7.5M18.5 15A7 7 0 0 1 6 16.5" />
            </svg>
            {copy.replay}
          </button>
        </div>
      </div>
    </div>
  );
}
