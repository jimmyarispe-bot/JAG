"use client";

import { useState } from "react";
import { submitStudentQuestionnaire } from "@/lib/admissions/student-questionnaire/actions";
import {
  STUDENT_QUESTIONS,
  type StudentQuestionKey,
} from "@/lib/admissions/student-questionnaire/questions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

/**
 * The form the student fills in.
 *
 * Five boxes, generous ones. The questions ask for a paragraph and a
 * single-line input would tell the student to write a sentence instead.
 *
 * Partial answers go through. A student who has answered four and is stuck on
 * the fifth should be able to send four rather than close the tab — and the
 * alternative, a browser refusing to submit until every box is full, is how a
 * sixteen-year-old decides not to bother.
 */
export function StudentQuestionnaireForm({ token }: { token: string }) {
  const [values, setValues] = useState<Partial<Record<StudentQuestionKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const answered = STUDENT_QUESTIONS.filter((q) => (values[q.key] ?? "").trim()).length;

  /**
   * The house action control rather than a hand-rolled button.
   *
   * It spins, disables itself, drives the progress bar at the top of the page,
   * and — the part that matters here — ignores a second click outright rather
   * than trusting the disabled attribute to have rendered in time. Somebody who
   * has just written five paragraphs and is not sure the button worked will
   * press it again; this form answers that before they ask.
   */
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Send my answers", loading: "Sending…", success: "✓ Sent" },
    successToast: false,
    errorToast: "We could not send that.",
    progressLabel: "Sending your answers…",
    onError: (err) => setError(err.message),
  });

  function submit() {
    setError(null);
    void action.run(async () => {
      const result = await submitStudentQuestionnaire({ token, answers: values });
      if (!result.ok) throw new Error(result.error);
      setDone(true);
      return result;
    });
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">Thank you</h2>
        <p className="mt-2 text-emerald-800">
          Your answers are with the admissions team. There is nothing else for you to do —
          they will be in touch with your family.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {STUDENT_QUESTIONS.map((question, index) => (
        <div key={question.key}>
          <label
            htmlFor={question.key}
            className="block text-sm font-medium text-slate-900"
          >
            {index + 1}. {question.label}
          </label>
          <textarea
            id={question.key}
            name={question.key}
            rows={5}
            value={values[question.key] ?? ""}
            onChange={(e) =>
              setValues((v) => ({ ...v, [question.key]: e.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      ))}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <ActionButton
          type="submit"
          size="lg"
          variant="primary"
          status={action.status}
          verb="submit"
          disabled={answered === 0}
          labels={{ idle: "Send my answers", loading: "Sending…", success: "✓ Sent" }}
          errorMessage={action.errorMessage}
          className="btn-academy rounded-xl px-10 py-3.5 text-base font-semibold"
        />
        <span className="text-sm text-slate-500">
          {answered} of {STUDENT_QUESTIONS.length} answered
        </span>
      </div>

      <p className="text-sm text-slate-500">
        You can only send once, so finish what you want to say before you press the button.
      </p>
    </form>
  );
}
