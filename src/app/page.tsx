"use client";

import { type FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { MAX_QUESTION_LENGTH, sortQuestions } from "@/lib/questions";
import { useQuestions } from "@/lib/use-questions";
import { useVotedIds } from "@/lib/voted";

export default function AudiencePage() {
  const { questions, setQuestions, loading, error, refetch } = useQuestions();
  const { voted, setVoted } = useVotedIds();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  async function handleUpvote(id: string) {
    if (voted.has(id)) return;
    setVoted(id, true);
    setVoteError(null);
    setQuestions((prev) =>
      sortQuestions(
        prev.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q)),
      ),
    );
    const { error } = await supabase.rpc("upvote", { question_id: id });
    if (error) {
      setVoted(id, false);
      setVoteError("Your vote didn't go through. Please try again.");
      refetch();
    }
  }

  const trimmed = text.trim();
  const canPost = trimmed.length > 0 && !posting;

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    if (!canPost) return;
    setPosting(true);
    setPostError(null);
    const { error } = await supabase.from("questions").insert({ text: trimmed });
    setPosting(false);
    if (error) {
      setPostError("Couldn't post your question. Please try again.");
      return;
    }
    setText("");
    refetch();
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Doubt Board</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ask anonymously. Upvote what you want answered.
        </p>
      </header>

      <form onSubmit={handleAsk} className="mb-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          rows={3}
          placeholder="What's your doubt?"
          aria-label="Your question"
          className="w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span
            className={`text-sm tabular-nums ${
              text.length >= MAX_QUESTION_LENGTH
                ? "text-red-600"
                : "text-zinc-500"
            }`}
          >
            {text.length}/{MAX_QUESTION_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!canPost}
            className="h-12 min-w-28 rounded-xl bg-indigo-600 px-6 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {posting ? "Asking…" : "Ask"}
          </button>
        </div>
        {postError && <p className="mt-2 text-red-600">{postError}</p>}
      </form>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {voteError && <p className="mb-4 text-red-600">{voteError}</p>}

      {loading ? (
        <p className="text-zinc-500">Loading questions…</p>
      ) : questions.length === 0 ? (
        <p className="text-zinc-500">No questions yet. Be the first to ask!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {questions.map((q) => {
            const hasVoted = voted.has(q.id);
            return (
              <li
                key={q.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() => handleUpvote(q.id)}
                  disabled={hasVoted}
                  aria-label={hasVoted ? "You upvoted this" : "Upvote"}
                  aria-pressed={hasVoted}
                  className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-lg font-bold tabular-nums transition-colors ${
                    hasVoted
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-zinc-300 hover:border-indigo-500 hover:text-indigo-600 active:bg-indigo-50 dark:border-zinc-700 dark:active:bg-indigo-950"
                  }`}
                >
                  <span aria-hidden className="text-sm leading-none">
                    ▲
                  </span>
                  {q.votes}
                </button>
                <p className="flex-1 self-center wrap-break-word text-lg">
                  {q.text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
