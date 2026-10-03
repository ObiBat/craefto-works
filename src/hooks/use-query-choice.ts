"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};

/**
 * A choice kept in the address (?key=value): read after hydration, so the
 * server and the first client render agree, and replaced in place (no new
 * history entry) when the visitor picks another.
 */
export function useQueryChoice<T extends string>(key: string, options: readonly T[], fallback: T): [T, (next: T) => void] {
  const fromUrl = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(key),
    () => null,
  );
  const [picked, setPicked] = useState<T | null>(null);
  const value = picked ?? (fromUrl && (options as readonly string[]).includes(fromUrl) ? (fromUrl as T) : fallback);
  const choose = (next: T) => {
    setPicked(next);
    const url = new URL(window.location.href);
    if (next === fallback) url.searchParams.delete(key);
    else url.searchParams.set(key, next);
    window.history.replaceState(window.history.state, "", url);
  };
  return [value, choose];
}
