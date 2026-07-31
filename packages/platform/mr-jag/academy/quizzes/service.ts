/**
 * Quiz scoring — multiple choice, true/false, scenario; retake supported.
 */

import { randomUUID } from "node:crypto";
import {
  appendQuizAttempt,
  getQuiz,
  listQuizAttempts,
  listQuizzes,
} from "../store";
import type { QuizAttempt, QuizDefinition } from "../types";

export function scoreQuiz(input: {
  quizId: string;
  userId: string;
  organizationId: string;
  answers: readonly number[];
}): QuizAttempt | { error: string } {
  const quiz = getQuiz(input.quizId);
  if (!quiz) return { error: "Quiz not found." };
  if (input.answers.length !== quiz.questions.length) {
    return { error: "Answer count must match question count." };
  }
  let correct = 0;
  quiz.questions.forEach((q, i) => {
    if (input.answers[i] === q.correctIndex) correct += 1;
  });
  const score = Math.round((correct / quiz.questions.length) * 100);
  const attempt: QuizAttempt = {
    id: `attempt:${randomUUID()}`,
    quizId: quiz.id,
    userId: input.userId,
    organizationId: input.organizationId,
    answers: Object.freeze([...input.answers]),
    score,
    passed: score >= quiz.passingScore,
    createdAt: new Date().toISOString(),
  };
  return appendQuizAttempt(attempt);
}

export function explainQuiz(quizId: string): QuizDefinition | null {
  return getQuiz(quizId);
}

export function listQuizCatalog(persona?: string): readonly QuizDefinition[] {
  if (!persona) return listQuizzes();
  return Object.freeze(
    listQuizzes().filter(
      (q) => q.persona.toLowerCase() === persona.toLowerCase()
    )
  );
}

export function listAttemptsForUser(
  organizationId: string,
  userId: string
): readonly QuizAttempt[] {
  return listQuizAttempts(organizationId, userId);
}
