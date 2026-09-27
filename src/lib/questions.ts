export type Question = {
  id: string;
  text: string;
  votes: number;
  hidden: boolean;
  created_at: string;
};

export const MAX_QUESTION_LENGTH = 280;

export function sortQuestions(questions: Question[]): Question[] {
  return [...questions].sort(
    (a, b) =>
      b.votes - a.votes || Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}
