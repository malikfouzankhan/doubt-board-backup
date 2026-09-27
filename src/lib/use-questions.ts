"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase-browser";
import { type Question, sortQuestions } from "./questions";

async function fetchVisibleQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from("questions").select("*");
  if (error) throw error;
  return sortQuestions(data);
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
          setError("Couldn't load questions.");
          setLoading(false);
        },
      ),
    [],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { questions, setQuestions, loading, error, refetch };
}
