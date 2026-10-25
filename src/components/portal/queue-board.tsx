"use client";

import * as React from "react";
import Link from "next/link";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { reorderQueue } from "@/app/portal/actions";
import type { RequestStatus } from "@/lib/portal/types";
import { cn } from "@/lib/utils";
import { RequestStatusPill } from "./status-pill";

export interface QueueItem {
  id: string;
  title: string;
  /** Its line of facts (request-list.tsx requestFacts), made on the server. */
  facts: string;
  status: RequestStatus;
}

type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

/**
 * The client's queue in the order we'll take it, reordered by dragging a
 * row's handle (or focusing it and using the arrow keys). Each new order is
 * saved as it's dropped; if it can't be, the rows go back. Read only while
 * Craefto views as the client.
 */
export function QueueBoard({ items, readOnly }: { items: QueueItem[]; readOnly: boolean }) {
  const serverOrder = items.map((item) => item.id).join();
  const [order, setOrder] = React.useState(() => items.map((item) => item.id));
  const [known, setKnown] = React.useState(serverOrder);
  const [state, setState] = React.useState<SaveState>({ kind: "idle" });
  const [announcement, setAnnouncement] = React.useState("");
  const help = React.useId();

  // The order on screen and the one last saved (or being saved), for handlers
  // the drag keeps from when it began.
  const latest = React.useRef(order);
  const saved = React.useRef(serverOrder);
  React.useLayoutEffect(() => {
    latest.current = order;
  }, [order]);
  React.useLayoutEffect(() => {
    saved.current = serverOrder;
  }, [serverOrder]);

  // The server's order changed (a save, an approval, Craefto's move): follow it.
  if (serverOrder !== known) {
    setKnown(serverOrder);
    setOrder(items.map((item) => item.id));
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const rows = order.filter((id) => byId.has(id));

  async function save(next: string[]) {
    if (next.join() === saved.current) return;
    const previous = saved.current;
    saved.current = next.join();
    setState({ kind: "saving" });
    const result = await reorderQueue(next);
    if (result.error) {
      saved.current = previous;
      setOrder(previous.split(","));
      setState({ kind: "error", message: result.error });
      return;
    }
    setState({ kind: "saved" });
  }

  function move(id: string, to: number) {
    const from = rows.indexOf(id);
    const target = Math.max(0, Math.min(rows.length - 1, to));
    if (from < 0 || from === target) return;
    const next = [...rows];
    next.splice(target, 0, ...next.splice(from, 1));
    setOrder(next);
    setAnnouncement(`Moved “${byId.get(id)?.title}” to number ${target + 1} of ${next.length}.`);
    void save(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <Reorder.Group axis="y" values={rows} onReorder={readOnly ? () => {} : setOrder} className="flex flex-col gap-2">
        {rows.map((id, index) => (
          <Row
            key={id}
            item={byId.get(id)!}
            position={index + 1}
            count={rows.length}
            readOnly={readOnly}
            help={help}
            onDrop={() => save(latest.current)}
            onMove={(to) => move(id, to)}
          />
        ))}
      </Reorder.Group>
      <p id={help} className="sr-only">
        Drag a request by its handle, or focus the handle and press the up and down arrow keys; Home and End move it to the top or the bottom.
      </p>
      <p aria-live="polite" className="min-h-5 text-sm text-[hsl(var(--color-foreground-subtle))]">
        {readOnly
          ? "Viewing as the client: their order can't be changed from here."
          : state.kind === "saving"
            ? "Saving the new order…"
            : state.kind === "saved"
              ? "Order saved. We'll work from the top."
              : state.kind === "error"
                ? <span className="text-[hsl(var(--color-error))]">{state.message}</span>
                : ""}
        <span className="sr-only">{announcement}</span>
      </p>
    </div>
  );
}

function Row({
  item,
  position,
  count,
  readOnly,
  help,
  onDrop,
  onMove,
}: {
  item: QueueItem;
  position: number;
  count: number;
  readOnly: boolean;
  help: string;
  onDrop: () => void;
  onMove: (to: number) => void;
}) {
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const [dragging, setDragging] = React.useState(false);

  function keys(event: React.KeyboardEvent) {
    const to = { ArrowUp: position - 2, ArrowDown: position, Home: 0, End: count - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    onMove(to);
  }

  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        onDrop();
      }}
      transition={reduce ? { duration: 0 } : undefined}
      className={cn(
        "relative flex items-center rounded-2xl bg-[hsl(var(--color-background-subtle))] transition-colors",
        dragging ? "z-10 bg-[hsl(var(--color-background))] shadow-[0_12px_32px_-12px_hsl(var(--color-foreground)/0.35)] ring-1 ring-[hsl(var(--color-border))]" : "hover:bg-[hsl(var(--color-accent-subtle))]"
      )}
    >
      {readOnly ? (
        <span aria-hidden="true" className="w-3 shrink-0" />
      ) : (
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          onKeyDown={keys}
          aria-label={`Reorder “${item.title}”, number ${position} of ${count}`}
          aria-describedby={help}
          className={cn(
            "grid min-h-0 w-11 shrink-0 cursor-grab touch-none place-items-center self-stretch rounded-l-2xl text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--color-accent))]",
            dragging && "cursor-grabbing"
          )}
        >
          <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5.5" cy="3.5" r="1.25" />
            <circle cx="10.5" cy="3.5" r="1.25" />
            <circle cx="5.5" cy="8" r="1.25" />
            <circle cx="10.5" cy="8" r="1.25" />
            <circle cx="5.5" cy="12.5" r="1.25" />
            <circle cx="10.5" cy="12.5" r="1.25" />
          </svg>
        </button>
      )}
      <Link href={`/portal/requests/${item.id}`} draggable={false} className="group flex min-w-0 flex-1 items-center gap-4 py-4 pr-5">
        <span
          aria-label={`Number ${position} in your queue`}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--color-background))] font-mono text-sm font-medium tabular-nums text-[hsl(var(--color-foreground-muted))]"
        >
          {position}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span className="min-w-0">
            <span className="block truncate font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">{item.title}</span>
            <span className="mt-0.5 block text-sm text-[hsl(var(--color-foreground-subtle))]">{item.facts}</span>
          </span>
          <span className="self-start sm:self-auto">
            <RequestStatusPill status={item.status} />
          </span>
        </span>
      </Link>
    </Reorder.Item>
  );
}
