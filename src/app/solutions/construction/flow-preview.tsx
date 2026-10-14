"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowsClockwise,
  Buildings,
  CalendarDots,
  Check,
  DeviceMobileSpeaker,
  Pause,
  Play,
  Receipt,
  Timer,
  UserCheck,
  type Icon,
} from "@phosphor-icons/react";
import { APPS, type AppId } from "./workflow/apps";

// The hero's preview of the workflow in section 03: a week on Site A in
// miniature. The five daily stages fill down a rail and start again each
// working day; Tuesday has a sick day for a supervisor to approve, Thursday
// a day hire, and Friday the pay run. It plays on a loop while on screen,
// with a pause button, and holds still on Friday for reduced motion. Every
// figure is fictional.

type RowId = "jobs" | "scheduling" | "approval" | "crew" | "timesheets" | "payroll";
type RowState = "idle" | "active" | "waiting" | "done";
type Tone = "warn" | "ok";

const DAILY: { id: RowId; title: string; icon: Icon; apps?: AppId[] }[] = [
  { id: "jobs", title: "Jobs and sites", icon: Buildings, apps: ["procore", "drive", "excel"] },
  { id: "scheduling", title: "Scheduling", icon: CalendarDots, apps: ["assignar", "deputy", "calendar"] },
  { id: "approval", title: "Supervisor approval", icon: UserCheck },
  { id: "crew", title: "Crew and attendance", icon: DeviceMobileSpeaker, apps: ["whatsapp", "twilio", "maps"] },
  { id: "timesheets", title: "Timesheets and costing", icon: Timer },
];
const PAYROLL = { id: "payroll" as const, title: "Payroll and accounts", icon: Receipt, apps: ["xero", "myob", "quickbooks"] as AppId[] };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** One beat: the day, where the signal is (0 to 4 the daily stages, 5 the way to the next day, 6 and 7 the pay run), and the header. */
interface Beat {
  day: number;
  at: number;
  key?: "tue-gap" | "tue-wait" | "tue-ok" | "thu-pour" | "thu-short" | "thu-hire";
  status: string;
  tone?: Tone;
  ms: number;
}

const routine = (day: number): Beat[] => [
  { day, at: 0, status: "A routine day", ms: 520 },
  { day, at: 1, status: "A routine day", ms: 520 },
  { day, at: 2, status: "Approved", tone: "ok", ms: 560 },
  { day, at: 3, status: "Crew on site", ms: 520 },
  { day, at: 4, status: "Hours approved", ms: 700 },
  { day, at: 5, status: "Next working day", ms: 650 },
];

const BEATS: Beat[] = [
  ...routine(0),
  { day: 1, at: 0, status: "2 off sick", tone: "warn", ms: 700 },
  { day: 1, at: 1, key: "tue-gap", status: "AI suggests cover", ms: 1300 },
  { day: 1, at: 2, key: "tue-wait", status: "Waiting for approval", tone: "warn", ms: 1500 },
  { day: 1, at: 2, key: "tue-ok", status: "Approved", tone: "ok", ms: 700 },
  { day: 1, at: 3, status: "Crew on site", ms: 560 },
  { day: 1, at: 4, status: "Hours approved", ms: 650 },
  { day: 1, at: 5, status: "Next working day", ms: 600 },
  ...routine(2),
  { day: 3, at: 0, key: "thu-pour", status: "Pour brought forward", tone: "warn", ms: 1100 },
  { day: 3, at: 1, key: "thu-short", status: "3 short: day hire", tone: "warn", ms: 1300 },
  { day: 3, at: 1, key: "thu-hire", status: "3 hired for the day", ms: 1300 },
  { day: 3, at: 2, status: "Approved", tone: "ok", ms: 700 },
  { day: 3, at: 3, status: "9 on site", ms: 600 },
  { day: 3, at: 4, status: "63 h approved", ms: 700 },
  { day: 3, at: 5, status: "Next working day", ms: 600 },
  ...routine(4).slice(0, 5),
  { day: 4, at: 6, status: "Pay run ready", ms: 1300 },
  { day: 4, at: 7, status: "Sent to Xero", tone: "ok", ms: 2200 },
];
const FINAL = BEATS.length - 1;

/** Approved hours in the pay week after a beat. */
function weekHours(beat: number) {
  let hours = 0;
  for (let i = 0; i <= beat; i += 1) if (BEATS[i].at === 4) hours += 42;
  return hours;
}

function dailyState(index: number, beat: Beat): RowState {
  if (beat.at >= 5) return "done";
  if (index < beat.at) return "done";
  if (index > beat.at) return "idle";
  if (beat.key === "tue-gap" || beat.key === "tue-wait" || beat.key === "thu-pour" || beat.key === "thu-short") return "waiting";
  if (DAILY[index].id === "approval") return "done";
  return "active";
}

/** What a stage says at a beat. */
function line(id: RowId, beat: Beat, step: number): { text: string; tone?: Tone } {
  const thursday = beat.day === 3;
  const state = id === "payroll" ? null : dailyState(DAILY.findIndex((row) => row.id === id), beat);
  switch (id) {
    case "jobs":
      return thursday ? { text: "Pour brought forward: 9 needed", tone: beat.key === "thu-pour" ? "warn" : undefined } : { text: "Site A · 6 fixers" };
    case "scheduling":
      if (beat.key === "tue-gap") return { text: "2 off sick · AI: move 2 from Site B", tone: "warn" };
      if (beat.key === "thu-short") return { text: "3 short · AI: hire for the day", tone: "warn" };
      if (thursday && state !== "idle") return { text: "9 of 9 · 3 on day hire" };
      if (beat.day === 1 && state === "done") return { text: "6 of 6 · 2 from Site B" };
      return { text: "6 of 6 rostered" };
    case "approval":
      if (beat.key === "tue-wait") return { text: "Move 2 fixers to Site A?" };
      return state === "done" ? { text: "Approved by the supervisor" } : { text: "A person decides" };
    case "crew":
      if (state === "idle") return { text: "Waits for approval" };
      return { text: thursday ? "9 on site · 3 day hire" : "6 on site · signed in" };
    case "timesheets":
      if (state === "idle") return { text: "Approved hours only" };
      return { text: thursday ? "63 h · day hire kept apart" : "42 h approved · costed" };
    case "payroll":
      if (beat.at === 7) return { text: "Sent to Xero · signed off" };
      if (beat.at === 6) return { text: "210 h · pay run ready" };
      return { text: `${weekHours(step)} h this week · weekly or fortnightly` };
  }
}

const STILL = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(STILL);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function Apps({ apps, lit }: { apps: AppId[]; lit: boolean }) {
  return (
    <span className="fp-apps" data-lit={lit ? "" : undefined}>
      {apps.map((id, order) => {
        const app = APPS[id];
        return (
          <span key={id} className="fp-app" data-tile={"tile" in app && app.tile ? "" : undefined} style={{ "--j": order } as CSSProperties}>
            <Image src={app.src} alt="" width={32} height={32} unoptimized loading="eager" />
          </span>
        );
      })}
    </span>
  );
}

export function FlowPreview() {
  const root = useRef<HTMLElement>(null);
  const labelId = useId();
  const still = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(STILL).matches,
    () => false,
  );
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const shown = still ? FINAL : step;
  const running = !still && !paused && ready && onScreen && pageVisible;

  // Start once the hero has settled (later on a first visit, after the brand intro).
  useEffect(() => {
    if (still) return;
    const intro = document.documentElement.classList.contains("intro-delay") ? 2100 : 0;
    const timer = window.setTimeout(() => setReady(true), 1200 + intro);
    return () => window.clearTimeout(timer);
  }, [still]);

  // Only while it's on screen and the tab is showing.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(element);
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // A week on a loop: after Friday's pay run, Monday again.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setStep(step === FINAL ? 0 : step + 1), BEATS[step].ms);
    return () => window.clearTimeout(timer);
  }, [running, step]);

  const beat = BEATS[shown];
  const at = Math.min(beat.at, DAILY.length - 1);
  const payroll: RowState = beat.at === 7 ? "done" : beat.at === 6 ? "active" : "idle";

  return (
    <figure ref={root} className="fp" aria-labelledby={labelId} data-running={running ? "" : undefined}>
      <figcaption id={labelId} className="sr-only">
        A preview of the workflow on this page, over a week. Every working day, jobs, scheduling, a supervisor’s approval, the crew’s shifts and their hours go round
        the same cycle. When the crew is short, extra hands are hired for the day. Each week or fortnight, approved hours go to payroll in tools like Xero and MYOB,
        and the office signs off. Fictional data.
      </figcaption>

      <div className="fp-head">
        <div className="fp-head-text" aria-hidden="true">
          <span className="fp-kicker">
            <ArrowsClockwise size={12} weight="bold" />
            Every working day
          </span>
          <span className="fp-days">
            {DAYS.map((day, index) => (
              <span key={day} data-state={index < beat.day ? "done" : index === beat.day ? "current" : undefined}>
                {day}
              </span>
            ))}
          </span>
        </div>
        {!still ? (
          <button type="button" className="fp-toggle" aria-label={paused ? "Play the animation" : "Pause the animation"} onClick={() => setPaused((current) => !current)}>
            {paused ? <Play size={12} weight="fill" aria-hidden="true" /> : <Pause size={12} weight="fill" aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      <div className="fp-body" aria-hidden="true">
        <p key={beat.status} className="fp-status" data-tone={beat.tone}>
          <span className="fp-status-dot" />
          {beat.status}
        </p>

        <div className="fp-flow" style={{ "--fp-at": beat.at >= 5 ? DAILY.length - 1 : at } as CSSProperties} data-moving={beat.at < 5 ? "" : undefined} data-reset={beat.at === 0 ? "" : undefined}>
          <span className="fp-track">
            <span className="fp-fill" />
          </span>
          <span className="fp-dot" />
          <ol className="fp-rows">
            {DAILY.map((row, index) => {
              const state = dailyState(index, beat);
              const { text, tone } = line(row.id, beat, shown);
              const RowIcon = row.icon;
              return (
                <li key={row.id} className="fp-row" data-row={row.id} data-state={state}>
                  <span className="fp-node">{state === "done" && !row.apps ? <Check size={13} weight="bold" /> : <RowIcon size={15} weight="duotone" />}</span>
                  <span className="fp-text">
                    <span className="fp-title">{row.title}</span>
                    <span key={text} className="fp-line" data-tone={tone}>
                      {text}
                    </span>
                  </span>
                  <span className="fp-end">
                    {row.id === "scheduling" && beat.day === 3 && (beat.key === "thu-hire" || state === "done") ? (
                      <span className="fp-chip" data-tone="hire">
                        <span className="fp-chip-logo">
                          <Image src={APPS.facebook.src} alt="" width={28} height={28} unoptimized loading="eager" />
                        </span>
                        +3 day hire
                      </span>
                    ) : row.apps ? (
                      <Apps apps={row.apps} lit={state !== "idle"} />
                    ) : row.id === "approval" && state !== "idle" ? (
                      <span key={state} className="fp-chip" data-tone={state === "waiting" ? "warn" : "ok"}>
                        {state === "waiting" ? (
                          <>
                            <span className="fp-chip-dot" />
                            Needs approval
                          </>
                        ) : (
                          <>
                            <Check size={11} weight="bold" />
                            Approved
                          </>
                        )}
                      </span>
                    ) : row.id === "timesheets" && state !== "idle" ? (
                      <span className="fp-chip" data-tone="ok">
                        {beat.day === 3 ? "63 h" : "42 h"}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="fp-layer">
          <span>Weekly or fortnightly</span>
        </p>
        <div className="fp-row fp-row-pay" data-row="payroll" data-state={payroll}>
          <span className="fp-node">{payroll === "done" ? <Check size={13} weight="bold" /> : <Receipt size={15} weight="duotone" />}</span>
          <span className="fp-text">
            <span className="fp-title">{PAYROLL.title}</span>
            <span key={line("payroll", beat, shown).text} className="fp-line">
              {line("payroll", beat, shown).text}
            </span>
          </span>
          <span className="fp-end">
            <Apps apps={PAYROLL.apps} lit={payroll !== "idle"} />
          </span>
        </div>
      </div>

      <div className="fp-foot">
        <a href="#how-it-works" className="fp-link">
          See the full workflow
          <ArrowDown size={14} weight="bold" aria-hidden="true" />
        </a>
        <span className="fp-note">Demo · fictional data</span>
      </div>
    </figure>
  );
}
