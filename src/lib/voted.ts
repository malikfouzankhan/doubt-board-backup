"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "doubt-board:voted";
const listeners = new Set<() => void>();
// Fallback for browsers where localStorage throws (e.g. some private modes).
let memoryCopy = "[]";

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryCopy;
  } catch {
    return memoryCopy;
  }
}

function parseIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useVotedIds() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const voted = useMemo(() => new Set(parseIds(raw)), [raw]);

  const setVoted = useCallback((id: string, isVoted: boolean) => {
    const ids = new Set(parseIds(readRaw()));
    if (isVoted) ids.add(id);
    else ids.delete(id);
    memoryCopy = JSON.stringify([...ids]);
    try {
      localStorage.setItem(STORAGE_KEY, memoryCopy);
    } catch {}
    listeners.forEach((notify) => notify());
  }, []);

  return { voted, setVoted };
}
