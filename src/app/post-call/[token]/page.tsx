import { notFound } from "next/navigation";

import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  HS_OPTIONS,
  HS_OPTION_MATH_TUTORING,
  HS_OPTION_SL_TUTORING,
  HS_SCHOOL_ID,
  describeChoice,
  longDay,
  readFamilyAsk,
  type FamilyAsk,
} from "@/lib/admissions/placement";
import { recordPostCallAction } from "@/app/post-call/[token]/actions";
import { SaveButton } from "@/app/post-call/[token]/SaveButton";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import {
  POST_CALL_ACTIONS,
  actionsForPage,
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
  searchParams: Promise<{
    done?: string;
    problem?: string;
    why?: string;
    warning?: string;
  }>;
}) {
  const { token } = await params;
  const { done, problem, why, warning } = await searchParams;

  const subject = await leadForPostCallToken(token);
  if (!subject) notFound();

  // HS: what the parent asked for, shown beside the leader's choice.
  const familyAsk =
    subject.occasion === "shadow_day" && subject.schoolId === HS_SCHOOL_ID
      ? await readFamilyAsk(createServiceRoleClient() as never, subject.leadId)
      : null;

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

  if (done === "application_invited") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          The Application for Admissions is on its way.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.guardianName ?? "The family"} has the application and can
          start it whenever they are ready. {subject.studentName}&rsquo;s tour is
          marked held and the child has moved to Tour Completed.
        </p>
        <p className="mt-4 text-slate-700">
          Your notes are on {subject.studentName}&rsquo;s record. Nothing else is
          needed from you until the application comes through.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done === "shadow_day_accepted") {
    /*
     * THE PACKET SENTENCE IS CONDITIONAL, AND THAT IS THE WHOLE POINT.
     *
     * 14 October 2026. This screen used to say "the enrollment packet has been
     * built for them to sign" on every acceptance. applyAdmissionsDecision
     * sets a warning when there was no application row to build one from, or
     * when the generator failed - and in both cases that sentence is false in
     * front of the one person who could do something about it.
     *
     * The acceptance is still real and the family has still been told, so this
     * is not an error screen. It says what happened, then what did not.
     */
    const packetMissing = Boolean(warning?.trim());
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          {subject.studentName} is accepted.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.guardianName ?? "The family"} has been emailed the decision
          {packetMissing ? "." : ", and the enrollment packet has been built for them to sign."}
        </p>
        <p className="mt-4 text-slate-700">
          The shadow day is marked held and your notes are on{" "}
          {subject.studentName}&rsquo;s record.
          {packetMissing ? "" : " The business department picks this up from here."}
        </p>
        {packetMissing ? (
          <div className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">There is no enrollment packet yet.</p>
            {/* The reason in the words applyAdmissionsDecision wrote, not a
                paraphrase of them. */}
            <p className="mt-1">{warning}</p>
            {/*
              THE SPACE AFTER THE NAME IS EXPLICIT, AND HAS TO BE.

              Jimmy, 15 October, from the live screen: "good except we need a
              space here". It read "520 testis accepted", and the deny screen
              read "Jimmy Arispehas been emailed the decision".

              WHAT IS OBSERVED, from the live pages on 15 October: the two
              runs that lost their leading space are the two that carry an
              HTML entity. The paragraph above this one has the identical
              shape without one and kept its space.

              WHAT IS NOT ESTABLISHED: that the entity is the cause. esbuild
              preserves the space in all three shapes, and Turbopack's own
              transform could not be run here to check. The correlation is
              two observations, not a mechanism.

              So the fix does not depend on knowing which: {" "} is a string
              child, not whitespace text, and no transform can drop it.
            */}
            <p className="mt-2">
              {subject.studentName}{" "}
              is accepted and the family has been told, so nothing needs
              undoing &mdash; but there is nothing for them to sign yet. Tell
              Jimmy before you close this.
            </p>
          </div>
        ) : null}
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done === "shadow_day_denied") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Recorded. {subject.studentName} is marked declined.
        </h1>
        <p className="mt-4 text-slate-700">
          The shadow day is marked held and your notes are on{" "}
          {subject.studentName}&rsquo;s record.
        </p>
        {/*
          THIS SCREEN SAID THE OPPOSITE FOR HALF A DAY, AND IT WAS TRUE THEN.
          Until migration 554 there was no approved decline letter for a
          decision at this step, so it said nothing had been emailed and told
          the leader it had to come from her. Jimmy gave the words; the letter
          sends; the screen says so.
        */}
        {/* The explicit space, for the reason written on the accept screen.
            This run lost its leading space on the live page, which read
            "Jimmy Arispehas been emailed the decision". */}
        <p className="mt-4 text-slate-700">
          {subject.guardianName ?? "The family"}{" "}
          has been emailed the decision &mdash; the letter that says the
          limitation is ours and not{" "}
          {subject.studentFirstName}&rsquo;s.
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
  const options = actionsForPage(subject.fork, subject.occasion).filter(
    (option) => option.value !== "tour_requested" || subject.canRequestTour
  );

  /*
   * ───────────────────── AFTER A TOUR ─────────────────────
   *
   * THE PAGE CARRIES THE LETTER'S WORDS. Jimmy, 13 October, on the first
   * version of this: "i told you to use this letter as the standard but you
   * deviated. Why?" Every line below is lifted from migration 539's body or
   * from the page he approved afterwards. Newly written prose here is a
   * deviation, not a design decision.
   *
   *   the four facts, stacked bare, in the letter's order
   *   "RECORD YOUR NOTES"
   *   "Document important information revealed in your conversation with them."
   *   "Send <name>'s family the Application for Admissions?"
   *   his three buttons, unchanged
   *
   * The only thing here that is not his: the telephone number is a tel: link
   * rather than plain text, which is presentation of the letter's own fourth
   * fact and the same choice the interest-meeting page already makes.
   *
   * THREE SUBMIT BUTTONS, NOT RADIOS AND A SAVE. That is what he approved -
   * the question, then three answers. Each posts its own action. The
   * interest-meeting page below keeps radios and SaveButton, which is what is
   * approved and in use there.
   */
  /*
   * ───────────────────── AFTER A SHADOW DAY ─────────────────────
   *
   * THE PAGE CARRIES THE LETTER'S WORDS - migration 552's body, which Jimmy
   * corrected twice on 14 October. Every line below is from that letter or
   * from the mockup he approved:
   *
   *   the four facts, stacked bare, in the letter's order
   *   "RECORD YOUR NOTES"
   *   "Document important information revealed in your time with them."
   *   "Accept <name>?"
   *   his two buttons: "Accept - send email", "Deny - send email"
   *
   * It is the tour page's shape on purpose. A school leader who has used one
   * has used both, and the only difference is the question at the bottom.
   *
   * THIS IS THE LAST GATE, and the first time anything in the JAG has ever
   * been able to answer it: accept_or_deny opens behind shadow_day_completed,
   * a stage nothing had ever written until this shipped.
   */
  if (subject.occasion === "shadow_day") {
    return (
      <main className="mx-auto max-w-xl px-6 py-10">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          {subject.schoolName ?? "The Academy"}
        </p>

        <div className="mt-5 text-lg font-semibold leading-relaxed text-slate-900">
          <div>{subject.studentName}</div>
          {subject.studentGrade ? <div>{subject.studentGrade}</div> : null}
          {subject.studentAge !== null ? (
            <div>{subject.studentAge} yrs old</div>
          ) : null}
          {subject.guardianPhone ? (
            <div>
              <a
                href={dial ?? undefined}
                className="underline decoration-slate-300 underline-offset-4"
              >
                {subject.guardianPhone}
              </a>
            </div>
          ) : null}
        </div>

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
            <span className="block text-sm font-bold uppercase tracking-wide text-slate-900">
              Record your notes
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Document important information revealed in your time with them.
            </span>
            <textarea
              name="notes"
              rows={6}
              className="mt-3 w-full rounded-md border border-slate-300 p-3"
            />
          </label>

          {familyAsk ? <HsPlacementFields ask={familyAsk} firstName={subject.studentFirstName} /> : null}

          <div className="mt-8 border-t border-slate-200 pt-6">
            {/* The child's first name, not the guardian's - the same mistake
                the tour page made on its first live test. */}
            <p className="text-base text-slate-800">
              Accept {subject.studentFirstName}?
            </p>
            {/*
              THE CONSEQUENCE IS PRINTED, NOT HIDDEN IN A title=. These two do
              more than any other button on any of these pages - one of them
              emails an acceptance and builds an enrollment packet - and a
              leader pressing it on her phone at the school gate is entitled to
              read what it will do without hovering, which a phone cannot do.
            */}
            <div className="mt-4 space-y-3">
              {options.map((option) => (
                <div key={option.value}>
                  <button
                    type="submit"
                    name="action"
                    value={option.value}
                    className={
                      option.value === "shadow_day_accepted"
                        ? "w-full rounded-lg bg-violet-600 px-4 py-3.5 font-semibold text-white"
                        : "w-full rounded-lg border border-red-200 bg-white px-4 py-3.5 font-semibold text-red-700"
                    }
                  >
                    {option.label}
                  </button>
                  <p className="mt-1.5 px-1 text-xs text-slate-600">
                    {option.consequence}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </form>
      </main>
    );
  }

  if (subject.occasion === "tour") {
    return (
      <main className="mx-auto max-w-xl px-6 py-10">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          {subject.schoolName ?? "The Academy"}
        </p>

        <div className="mt-5 text-lg font-semibold leading-relaxed text-slate-900">
          <div>{subject.studentName}</div>
          {subject.studentGrade ? <div>{subject.studentGrade}</div> : null}
          {/* "Put - yrs old - beside age" - Jimmy, 13 October, reading the
              first live tour page. The letter still stacks the bare number. */}
          {subject.studentAge !== null ? (
            <div>{subject.studentAge} yrs old</div>
          ) : null}
          {subject.guardianPhone ? (
            <div>
              <a
                href={dial ?? undefined}
                className="underline decoration-slate-300 underline-offset-4"
              >
                {subject.guardianPhone}
              </a>
            </div>
          ) : null}
        </div>

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
            <span className="block text-sm font-bold uppercase tracking-wide text-slate-900">
              Record your notes
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Document important information revealed in your conversation with
              them.
            </span>
            <textarea
              name="notes"
              rows={6}
              className="mt-3 w-full rounded-md border border-slate-300 p-3"
            />
          </label>

          <div className="mt-8 border-t border-slate-200 pt-6">
            {/*
              HIS LINE, AND IT IS THE CHILD'S NAME, NOT THE GUARDIAN'S. The
              approved page reads "Send Konnor's family the Application for
              Admissions?". The first live test rendered "Send Jimmy Arispe
              the Application for Admissions?" because this read guardianName.
            */}
            <p className="text-base text-slate-800">
              Send {subject.studentFirstName}&rsquo;s family the Application for
              Admissions?
            </p>
            <div className="mt-4 space-y-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="submit"
                  name="action"
                  value={option.value}
                  title={option.consequence}
                  className={
                    option.value === "application_invited"
                      ? "w-full rounded-lg bg-violet-600 px-4 py-3.5 font-semibold text-white"
                      : option.value === "post_call_not_the_right_school"
                        ? "w-full rounded-lg border border-red-200 bg-white px-4 py-3.5 font-semibold text-red-700"
                        : "w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 font-semibold text-slate-900"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </form>
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

        <SaveButton />
      </form>
    </main>
  );
}

/**
 * HS PLACEMENT AT ACCEPT. Jimmy, 20 October 2026: "heather/school leader was
 * supposed to be given options of the classes the student will attend. And be
 * able to choose the actual start date. Preferred and start are both shown to
 * heather/school leader."
 *
 * Pre-filled from the parent's application; required only to accept, and
 * checked on the server, so Deny never trips over it.
 */
function HsPlacementFields({ ask, firstName }: { ask: FamilyAsk; firstName: string }) {
  const days = (option: string) =>
    option === HS_OPTION_SL_TUTORING ? ask.slTutoringDays : option === HS_OPTION_MATH_TUTORING ? ask.mathTutoringDays : null;
  return (
    <fieldset className="mt-8 space-y-4 border-t border-slate-200 pt-6">
      <legend className="text-sm font-bold uppercase tracking-wide text-slate-900">
        {firstName}&rsquo;s classes and start date
      </legend>
      <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Parent&rsquo;s preferred start:</span> {longDay(ask.preferredStart)}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Parent asked for:</span> {describeChoice(ask)}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Classes {firstName} will attend</p>
        {HS_OPTIONS.map((option) => (
          <div key={option} className="space-y-1">
            <label className="flex items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                name="placement_option"
                value={option}
                defaultChecked={ask.options.includes(option)}
                className="mt-1"
              />
              <span>{option}</span>
            </label>
            {option === HS_OPTION_SL_TUTORING || option === HS_OPTION_MATH_TUTORING ? (
              <label className="ml-6 flex items-center gap-2 text-xs text-slate-600">
                Days per month
                <input
                  type="number"
                  min={1}
                  max={31}
                  name={option === HS_OPTION_SL_TUTORING ? "placement_sl_days" : "placement_math_days"}
                  defaultValue={days(option) ?? ""}
                  className="w-20 rounded-md border border-slate-300 p-1"
                />
              </label>
            ) : null}
          </div>
        ))}
      </div>
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Actual start date</span>
        <input
          type="date"
          name="actual_start_date"
          defaultValue={ask.preferredStart ?? ""}
          className="mt-1 block rounded-md border border-slate-300 p-2"
        />
      </label>
    </fieldset>
  );
}
