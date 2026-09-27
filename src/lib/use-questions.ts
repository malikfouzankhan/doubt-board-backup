"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "./supabase-browser";
import { type Question, sortQuestions } from "./questions";

const REFETCH_INTERVAL_MS = 15_000;

async function fetchVisibleQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from("questions").select("*");
  if (error) throw error;
  return sortQuestions(data);
}

function applyChange(
  prev: Question[],
  payload: RealtimePostgresChangesPayload<Question>,
): Question[] {
  if (payload.eventType === "DELETE") {
    return prev.filter((q) => q.id !== payload.old.id);
  }
  const row = payload.new;
  const others = prev.filter((q) => q.id !== row.id);
  return sortQuestions(row.hidden ? others : [...others, row]);
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    () =>
      fetchVisibleQuestions().then(
        (fresh) => {
          setQuestions(fresh);
          setError(null);
          setLoading(false);
        },
        () => {
          setError("Couldn't load questions. Retrying…");
          setLoading(false);
        },
      ),
    [],
  );

  useEffect(() => {
    refetch();

    // Unique name so a quick unmount/remount never reuses a channel that is still closing.
    const channel = supabase
      .channel(`questions-${Math.random().toString(36).slice(2)}`)
      .on<Question>(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        (payload) => setQuestions((prev) => applyChange(prev, payload)),
      )
      .subscribe();

    // Realtime never reports a row becoming hidden (RLS), and events can be missed on bad wifi.
    const timer = setInterval(refetch, REFETCH_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { questions, setQuestions, loading, error, refetch };
}
