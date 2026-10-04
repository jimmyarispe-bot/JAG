import { notFound } from "next/navigation";

import { recordApplicationCallAction } from "@/app/application-call/[token]/actions";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import {
  APPLICATION_CALL_ACTIONS,
  leadForApplicationCallToken,
} from "@/lib/admissions/automation/application-call";
import { telHref } from "@/lib/format/contact";

/**
 * Five days, three reminders, no application.
 *
 * Opened from the one link in the escalation email by a school leader who is
 * about to telephone a family. Same posture as /call/<token>: no sign-in, the
 * number big enough to dial from, one question, and a notes box that does not
 * insist on anything.
 *
 * THE DIFFERENCE IS THAT BOTH ANSWERS HERE DO SOMETHING. One re-sends the
 * invitation; the other closes the lead. So each one says what it will do
 * before it is pressed, and the page afterwards says what it did - not
 * "thank you", which is what you write when nothing happened.
 */

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  APPLICATION_CALL_ACTIONS.map((a) => [a.value, a.label])
);

export default async function ApplicationCallPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; problem?: string }>;
}) {
  const { token } = await params;
  const { done, problem } = await searchParams;

  const subject = await leadForApplicationCallToken(token);
  if (!subject) notFound();

  const dial = telHref(subject.guardianPhone);

  if (done === "application_resent") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          The invitation is on its way.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.guardianName ?? "The family"} has the application link again —
          the same one as before, so anything {subject.studentName} has already
          filled in is still there.
        </p>
        <p className="mt-4 text-slate-700">
          No more automatic reminders will go out. This family is yours now.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done === "application_not_proceeding") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Closed out. Nothing was sent to the family.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.studentName} is marked declined and will not be emailed again.
          If you want them to hear something from us, send it from their case
          page in JAG.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="text-sm uppercase tracking-wide text-slate-500">
        {subject.schoolName ?? "The Academy"}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        {subject.studentName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {subject.applicationOpenedNotSubmitted
          ? "Invited to apply. The application is open and has not been submitted."
          : "Invited to apply. No application has been started."}
      </p>

      {/* The reason the page exists, and the thing a thumb should hit first. */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-600">
          {subject.guardianName ?? "The family"}
        </p>
        {subject.guardianPhone ? (
          <a
            href={dial ?? undefined}
            className="mt-1 block text-3xl font-semibold tracking-tight text-slate-900 underline decoration-slate-300 underline-offset-4"
          >
            {subject.guardianPhone}
          </a>
        ) : (
          <p className="mt-1 text-lg text-slate-500">
            No telephone number on this inquiry.
          </p>
        )}
        {subject.guardianEmail ? (
          <p className="mt-2 text-sm text-slate-600">{subject.guardianEmail}</p>
        ) : null}
      </section>

      {subject.inquiryNotes?.trim() ? (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-700">
            What they told us when they inquired
          </h2>
          <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-slate-300 pl-4 text-slate-700">
            {subject.inquiryNotes.trim()}
          </blockquote>
        </section>
      ) : null}

      {subject.previousCalls.length ? (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-700">Already tried</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {subject.previousCalls.map((call) => (
              <li key={call.calledAt}>
                {appointmentTextForFamily(call.calledAt)} —{" "}
                {ACTION_LABELS[call.outcome] ?? call.outcome}
                {call.notes ? ` — ${call.notes}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {problem ? (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {problem === "choose"
            ? "Choose what should happen next before saving."
            : "That did not save. Tell Jimmy before you forget what you decided."}
        </p>
      ) : null}

      <form action={recordApplicationCallAction} className="mt-8">
        <input type="hidden" name="token" value={token} />

        <fieldset>
          <legend className="text-lg font-medium text-slate-900">
            After you have spoken to them
          </legend>
          <div className="mt-3 space-y-2">
            {APPLICATION_CALL_ACTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-400"
              >
                <input
                  type="radio"
                  name="action"
                  value={option.value}
                  className="mt-1"
                  required
                />
                <span>
                  <span className="block font-medium text-slate-900">
                    {option.label}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {option.consequence}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-slate-700">
            What came of it?{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            name="notes"
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-300 p-3"
            placeholder="Anything the next person to look at this family should know."
          />
        </label>

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white"
        >
          Save
        </button>
      </form>
    </main>
  );
}
