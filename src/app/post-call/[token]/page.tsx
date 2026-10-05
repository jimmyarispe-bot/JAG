import { notFound } from "next/navigation";

import { recordPostCallAction } from "@/app/post-call/[token]/actions";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import {
  POST_CALL_ACTIONS,
  actionsForFork,
  leadForPostCallToken,
} from "@/lib/admissions/automation/post-call";
import { telHref } from "@/lib/format/contact";

/**
 * "RECORD your notes" — opened from the letter that lands when the interest
 * meeting starts. All four campuses.
 *
 * Same posture as the other three button pages: no sign-in, the number big
 * enough to dial from, and a notes box that does not insist on anything.
 * Jimmy asked for the notes box first and the decision second, and that is
 * the order on the screen.
 *
 * THE BUTTONS DEPEND ON THE CHILD'S CAMPUS, not on who is signed in - nobody
 * is signed in. GA and FL are offered the tour; Virtual and HS are offered
 * the shadow day; both are offered "not the right school" and "not yet".
 *
 * TWO OF THESE THREE BUTTONS DO SOMETHING, so each says what it will do
 * before it is pressed, and the page afterwards says what it did rather than
 * "thank you" - which is what you write when nothing happened.
 *
 * THE TOUR BUTTON DISAPPEARS when the campus has no tour calendar, and the
 * page says why in the leader's own terms. Offering a button that cannot work
 * and failing after she has typed three paragraphs is worse than not offering
 * it: she has lost the notes and learned nothing.
 */

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  POST_CALL_ACTIONS.map((a) => [a.value, a.label])
);

export default async function PostCallPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; problem?: string; why?: string }>;
}) {
  const { token } = await params;
  const { done, problem, why } = await searchParams;

  const subject = await leadForPostCallToken(token);
  if (!subject) notFound();

  const dial = telHref(subject.guardianPhone);

  if (done === "tour_requested") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          The tour request is on its way.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.guardianName ?? "The family"} has the campus tour calendar and
          has been asked to pick a time. {subject.studentName} has moved to Tour
          Requested.
        </p>
        <p className="mt-4 text-slate-700">
          When the booking comes through you will see it on the board. Nothing
          else is needed from you until then.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done === "shadow_days_invited") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          The shadow day invitation is on its way.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.guardianName ?? "The family"} has the booking link and has
          been asked to choose a day. {subject.studentName} is marked Interest
          Meeting Held, and your notes are on their record.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done === "post_call_not_the_right_school") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Closed out, and the family has been thanked.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.studentName} is marked declined. The family has been sent the
          short thank-you and best wishes — the same letter the decision in JAG
          sends — and will not be emailed again.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done === "post_call_follow_up") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Saved. {subject.studentName} is marked Interest Meeting Held.
        </h1>
        <p className="mt-4 text-slate-700">
          Your notes are on the family&rsquo;s record and nothing was sent to
          them. The decision about what happens next is now waiting for you in
          JAG, whenever you are ready for it.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  /*
   * This campus's fork, minus the tour button where it cannot be carried out.
   * POST_CALL_ACTIONS stays imported because the label map above reads every
   * action, including the one this campus never sees.
   */
  const options = actionsForFork(subject.fork).filter(
    (option) => option.value !== "tour_requested" || subject.canRequestTour
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="text-sm uppercase tracking-wide text-slate-500">
        {subject.schoolName ?? "The Academy"}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        {subject.studentName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {subject.fork === "tour"
          ? "Your inquiry call with this family is scheduled for now."
          : "Your meeting with this family is scheduled for now."}{" "}
        Write down what was said while it is fresh.
      </p>

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
          <h2 className="text-sm font-medium text-slate-700">
            Already recorded
          </h2>
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

      {!subject.canRequestTour && subject.tourBlockedReason ? (
        <p className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          {subject.tourBlockedReason}
        </p>
      ) : null}

      {problem ? (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {problem === "choose"
            ? "Choose what should happen next before saving."
            : why?.trim()
              ? why
              : "That did not save. Tell Jimmy before you forget what you decided."}
        </p>
      ) : null}

      <form action={recordPostCallAction} className="mt-8">
        <input type="hidden" name="token" value={token} />

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Your notes{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            name="notes"
            rows={5}
            className="mt-2 w-full rounded-md border border-slate-300 p-3"
            placeholder="What the family is looking for, anything about the child, anything the next person to look at this family should know."
          />
        </label>

        <fieldset className="mt-8">
          <legend className="text-lg font-medium text-slate-900">
            What happens next for {subject.studentName}?
          </legend>
          <div className="mt-3 space-y-2">
            {options.map((option) => (
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
