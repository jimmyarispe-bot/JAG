import { notFound } from "next/navigation";

import { recordCallAction } from "@/app/call/[token]/actions";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import { CALL_OUTCOMES, leadForCallToken } from "@/lib/admissions/chase/call-token";
import { telHref } from "@/lib/format/contact";

/**
 * Record the call.
 *
 * Opened from the one link in the escalation email, at seven in the morning,
 * by a school leader who is about to dial a number - quite possibly on a
 * phone, standing up, with ninety seconds of attention.
 *
 * SO: NO SIGN-IN, ONE QUESTION, AND THE NUMBER BIG ENOUGH TO READ WHILE
 * DIALLING. Everything else on this page is there to make the first sentence
 * of the call easy. The notes box is optional on purpose - a form that
 * insists on a paragraph gets a full stop typed into it, and then the record
 * says nothing AND the leader resents it.
 *
 * The page is deliberately plain. It is read once, acted on, and closed.
 */

export const dynamic = "force-dynamic";

const OUTCOME_LABELS: Record<string, string> = Object.fromEntries(
  CALL_OUTCOMES.map((o) => [o.value, o.label])
);

export default async function RecordTheCallPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ recorded?: string; problem?: string }>;
}) {
  const { token } = await params;
  const { recorded, problem } = await searchParams;

  const subject = await leadForCallToken(token);
  if (!subject) notFound();

  const dial = telHref(subject.guardianPhone);

  if (recorded === "1") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Thank you — that is recorded.</h1>
        <p className="mt-4 text-slate-700">
          {subject.studentName} will not be emailed again automatically. Whatever
          happens next with this family happens because you decide it does.
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
        Inquired {appointmentTextForFamily(subject.inquiredAt)}
      </p>

      {/* The reason the page exists, and the thing a thumb should hit first. */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-600">{subject.guardianName ?? "The family"}</p>
        {subject.guardianPhone ? (
          <a
            href={dial ?? undefined}
            className="mt-1 block text-3xl font-semibold tracking-tight text-slate-900 underline decoration-slate-300 underline-offset-4"
          >
            {subject.guardianPhone}
          </a>
        ) : (
          <p className="mt-1 text-lg text-slate-500">No telephone number on this inquiry.</p>
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
                {OUTCOME_LABELS[call.outcome] ?? call.outcome}
                {call.notes ? ` — ${call.notes}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {problem ? (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {problem === "choose"
            ? "Choose how the call went before saving."
            : "That did not save. Tell Jimmy before you forget what was said."}
        </p>
      ) : null}

      <form action={recordCallAction} className="mt-8">
        <input type="hidden" name="token" value={token} />

        <fieldset>
          <legend className="text-lg font-medium text-slate-900">
            How did the call go?
          </legend>
          <div className="mt-3 space-y-2">
            {CALL_OUTCOMES.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-400"
              >
                <input
                  type="radio"
                  name="outcome"
                  value={option.value}
                  className="mt-1"
                  required
                />
                <span>
                  <span className="block font-medium text-slate-900">{option.label}</span>
                  <span className="block text-sm text-slate-600">{option.consequence}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-slate-700">
            What came of it? <span className="font-normal text-slate-500">(optional)</span>
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
          Record the call
        </button>
      </form>
    </main>
  );
}
