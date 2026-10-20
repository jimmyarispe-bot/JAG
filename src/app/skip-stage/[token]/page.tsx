import { notFound } from "next/navigation";

import { skipStageAction } from "@/app/skip-stage/[token]/actions";
import { leadForSkipToken } from "@/lib/admissions/automation/skip-stage";

/**
 * "Skip next stage" — opened from the button on a school leader's letter.
 *
 * Jimmy, 15 October 2026: "a parent has complete the inquiry form, and then
 * goes through the other stages but the school leader doesn't do the shadow
 * days and just move to acceptance."
 *
 * ── WHY THERE IS A PAGE AND NOT JUST A LINK ─────────────────────────────────
 *
 * Asked whether this should be one click from the inbox, Jimmy chose a page
 * that names the child first. The reason is not caution about his leaders:
 * Outlook and Gmail fire requests at the buttons in an email to check them
 * for safety, and a one-click skip is a child moved by software nobody
 * pressed. Every other button page in this flow - /post-call, /call,
 * /application-call, /send-interest-link - does the same thing for the same
 * reason.
 *
 * ── IT READS THE LIVE STAGE, WHICH IS WHAT MAKES AN OLD EMAIL SAFE ──────────
 *
 * A leader may press this in a three-week-old inquiry notice. She is shown
 * where the child is TODAY and what will actually happen, not what would have
 * happened the day the letter was sent. Konnor Broyld's tour was read off a
 * calendar three weeks after the fact on 13 October; letters outlive the
 * state they describe.
 *
 * NO SIGN-IN. The token is the authority, exactly as on the other four pages.
 */

export const dynamic = "force-dynamic";

export default async function SkipStagePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; problem?: string; why?: string; warning?: string; again?: string }>;
}) {
  const { token } = await params;
  const { done, problem, why, warning, again } = await searchParams;

  const subject = await leadForSkipToken(token);
  if (!subject) notFound();

  if (done && again) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Already skipped. {subject.studentName} is at {done}.
        </h1>
        <p className="mt-4 text-slate-700">
          That press had already been made, so nothing more changed and no
          second email was sent.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Skipped. {subject.studentName} is at {done}.
        </h1>
        {warning ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            {warning}
          </p>
        ) : (
          <p className="mt-4 text-slate-700">
            The next email is on its way to you with the question that comes
            after this one.
          </p>
        )}
        <p className="mt-4 text-slate-700">
          Nothing was sent to {subject.studentName}&rsquo;s family. Nothing is
          sent until you send it.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  const target = subject.target;

  /*
   * NOTHING TO SKIP, AND THE PAGE SAYS WHICH KIND OF NOTHING. A child at the
   * shadow days has only the decision left, and Jimmy's instruction on that
   * letter was "no skip button here" - so this is the state a leader reaches
   * by pressing an older email after the child has moved on, not a dead end
   * she was offered.
   */
  if (!target) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          There is no stage to skip for {subject.studentName}.
        </h1>
        <p className="mt-4 text-slate-700">
          {subject.studentName} is at {subject.currentStageLabel}. What comes
          next is your decision, and that is yours to make rather than skip.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Nothing has changed and nothing was sent.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">
        Skip the {target.skippedLabel} for {subject.studentName}?
      </h1>

      <div className="mt-6 space-y-1 text-slate-900">
        <p className="font-medium">{subject.studentName}</p>
        <p className="text-slate-700">{subject.schoolName ?? "No campus on the record"}</p>
        <p className="text-slate-700">Now at {subject.currentStageLabel}</p>
      </div>

      {problem ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-900">
          {why ?? "That did not save."}
        </p>
      ) : null}

      <div className="mt-8 space-y-3 text-slate-700">
        <p>
          <strong>
            The {target.skippedLabel} will not happen for {subject.studentName}.
          </strong>{" "}
          {subject.studentName} moves straight to the next question, and the
          card in JAG will say the stage was skipped rather than completed.
        </p>
        <p>
          Nothing goes to {subject.studentName}&rsquo;s family. The next email
          comes to you, with the button that sends them their link and a skip
          button of its own.
        </p>
      </div>

      <form action={skipStageAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="from" value={subject.currentStage ?? ""} />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
        >
          Skip the {target.skippedLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Close this page and nothing changes.
      </p>
    </main>
  );
}
