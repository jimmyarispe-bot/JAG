"use client";

import { useState, useTransition } from "react";
import {
  saveApplicationDraftAction,
  submitApplicationAction,
} from "@/lib/admissions/apply-link/actions";

interface TokenApplicationFormProps {
  token: string;
  studentName: string;
  values: Record<string, string>;
}

/**
 * The application, as a parent fills it in.
 *
 * Deliberately one page and seven questions. The portal wizard is a better
 * tool for a family who already has an account and a reason to come back; a
 * family invited to apply has neither, and every extra step between the link
 * and "Submit" is somewhere to give up.
 *
 * Save draft exists because a parent will start this on a phone at 9pm and
 * finish it later - the link is in their email and keeps working.
 */
const QUESTIONS: Array<{
  name: string;
  label: string;
  hint?: string;
  long?: boolean;
  required?: boolean;
}> = [
  {
    name: "previous_school",
    label: "Where is your child at school now?",
    hint: "If they are not in school at the moment, say so — it is not a problem.",
  },
  {
    name: "student_summary",
    label: "Tell us about your child",
    hint: "What they love, what they are like on a good day, what you want for them.",
    long: true,
    required: true,
  },
  {
    name: "learning_needs_summary",
    label: "How does your child learn best?",
    hint: "Anything that helps, anything that gets in the way. Diagnoses only if you want to share them.",
    long: true,
  },
  {
    name: "medical_notes",
    label: "Anything we need to know for their safety or care",
    hint: "Allergies, medication, medical conditions. Leave blank if there is nothing.",
    long: true,
  },
  {
    name: "guardian_notes",
    label: "Anything else you want us to know",
    long: true,
  },
  {
    name: "emergency_contact_name",
    label: "Emergency contact — name",
    required: true,
  },
  {
    name: "emergency_contact_phone",
    label: "Emergency contact — phone",
    required: true,
  },
];

export function TokenApplicationForm({
  token,
  studentName,
  values,
}: TokenApplicationFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: "save" | "submit", form: HTMLFormElement) {
    const data = new FormData(form);
    data.set("token", token);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result =
        action === "save"
          ? await saveApplicationDraftAction(data)
          : await submitApplicationAction(data);

      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (action === "save") {
        setMessage("Saved. You can close this and come back to the same link.");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">
          Thank you — {studentName}&apos;s application is in.
        </h2>
        <p className="mt-2 text-sm text-emerald-800">
          We have emailed you a link to choose shadow days — time in the school
          with the students and teachers {studentName} would be learning
          alongside. If it has not arrived in a few minutes, check your spam
          folder and then reply to our email and we will sort it out.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        run("submit", e.currentTarget);
      }}
    >
      {QUESTIONS.map((q) => (
        <div key={q.name}>
          <label
            htmlFor={q.name}
            className="block text-sm font-medium text-slate-900"
          >
            {q.label}
            {q.required ? <span className="text-red-600"> *</span> : null}
          </label>
          {q.hint ? (
            <p className="mt-0.5 text-sm text-slate-500">{q.hint}</p>
          ) : null}
          {q.long ? (
            <textarea
              id={q.name}
              name={q.name}
              rows={4}
              required={q.required}
              defaultValue={values[q.name] ?? ""}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <input
              id={q.name}
              name={q.name}
              type={q.name.endsWith("_phone") ? "tel" : "text"}
              required={q.required}
              defaultValue={values[q.name] ?? ""}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}
        </div>
      ))}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "Sending…" : "Submit application"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            const form = e.currentTarget.closest("form");
            if (form) run("save", form);
          }}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Save and finish later
        </button>
      </div>
    </form>
  );
}
