import { notFound } from "next/navigation";

import { answerDecisionAction } from "@/app/decide/[token]/[answer]/actions";
import {
  branchForLink,
  isLinkAnswer,
  leadForDecisionToken,
  wordingFor,
} from "@/lib/admissions/gates/answer-by-link";

/**
 * The answer buttons on the three "Decision needed" letters land here.
 *
 * Jimmy, 17 October 2026. The letter's button is the decision; this page is
 * the one more press that stops an email scanner from making it for her. See
 * answer-by-link.ts for why it is a page and not just a link.
 *
 * NO SIGN-IN. The token is the authority, as on /skip-stage and /post-call.
 */

export const dynamic = "force-dynamic";

export default async function DecidePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; answer: string }>;
  searchParams: Promise<{ done?: string; problem?: string; why?: string; warning?: string }>;
}) {
  const { token, answer } = await params;
  const { done, problem, why, warning } = await searchParams;

  if (!isLinkAnswer(answer)) notFound();
  const subject = await leadForDecisionToken(token);
  if (!subject) notFound();

  const name = subject.studentFirstName;

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Done. The email is on its way.</h1>
        {warning ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            {warning}
          </p>
        ) : null}
        <p className="mt-4 text-slate-700">
          {subject.studentFullName} is at {subject.currentStageLabel}.
        </p>
        <p className="mt-6 text-sm text-slate-500">You can close this page.</p>
      </main>
    );
  }

  const branch = branchForLink(subject.gateKey, answer);
  const wording = subject.gateKey ? wordingFor(subject.gateKey, answer, name) : null;

  /* The question has passed - an older letter pressed after the child moved. */
  if (!branch || !wording) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          This question has passed for {subject.studentFullName}.
        </h1>
        <p className="mt-4 text-slate-700">
          {name} is at {subject.currentStageLabel} now.
        </p>
        <p className="mt-6 text-sm text-slate-500">Nothing has changed and nothing was sent.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">{wording.question}</h1>

      <div className="mt-6 space-y-1 text-slate-900">
        <p className="font-medium">{subject.studentFullName}</p>
        <p className="text-slate-700">{subject.schoolName ?? "No campus on the record"}</p>
        <p className="text-slate-700">Now at {subject.currentStageLabel}</p>
      </div>

      {problem ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-900">
          {why ?? "That did not save."}
        </p>
      ) : null}

      <p className="mt-8 text-slate-700">{wording.consequence ?? branch.consequence}</p>

      <form action={answerDecisionAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="answer" value={answer} />
        <button
          type="submit"
          className="rounded-md bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-700"
        >
          {wording.button}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">Close this page and nothing is sent.</p>
    </main>
  );
}
