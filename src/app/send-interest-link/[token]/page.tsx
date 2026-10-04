import { notFound } from "next/navigation";

import { sendInterestLinkAction } from "@/app/send-interest-link/[token]/actions";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import { leadForInterestLinkToken } from "@/lib/admissions/send-interest-link";
import { telHref } from "@/lib/format/contact";

/**
 * The family has inquired and heard nothing. One button changes that.
 *
 * Opened from the new-inquiry notice, usually within minutes, by a school
 * leader who has just read what a parent wrote about their child. No
 * sign-in: the token is the authority, the same as every other page in this
 * chain that a leader opens from her phone.
 *
 * What she sees before she presses it is the point. The child's name, what
 * the family said, and the fact that nobody has contacted them yet.
 */

export const dynamic = "force-dynamic";

export default async function SendInterestLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sent?: string; problem?: string }>;
}) {
  const { token } = await params;
  const { sent, problem } = await searchParams;

  const subject = await leadForInterestLinkToken(token);
  if (!subject) notFound();

  const dial = telHref(subject.guardianPhone);

  if (sent === "1" || subject.alreadySent) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          {subject.guardianName ?? "The family"} has the link.
        </h1>
        <p className="mt-4 text-slate-700">
          They can now pick a time to talk about {subject.studentName}. The
          moment they book, you and they both get a confirmation.
        </p>
        <p className="mt-4 text-slate-700">
          If they have not booked in two days, we will remind them. After three
          attempts it comes back to you as a phone call.
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

      <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <strong>This family has not heard from us yet.</strong> Nothing is sent
        until you send it.
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-600">
          {subject.guardianName ?? "The family"}
        </p>
        {subject.guardianEmail ? (
          <p className="mt-1 text-lg text-slate-900">{subject.guardianEmail}</p>
        ) : (
          <p className="mt-1 text-lg text-red-700">
            No email address on this inquiry — the link cannot be sent.
          </p>
        )}
        {subject.guardianPhone ? (
          <a
            href={dial ?? undefined}
            className="mt-2 block text-xl font-medium text-slate-900 underline decoration-slate-300 underline-offset-4"
          >
            {subject.guardianPhone}
          </a>
        ) : null}
      </section>

      {subject.inquiryNotes?.trim() ? (
        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-700">
            What they told us about {subject.studentName}
          </h2>
          <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-slate-300 pl-4 text-slate-700">
            {subject.inquiryNotes.trim()}
          </blockquote>
        </section>
      ) : null}

      {problem ? (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          That did not send. Try once more, and if it fails again tell Jimmy —
          the family has still not heard from us.
        </p>
      ) : null}

      <form action={sendInterestLinkAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={!subject.guardianEmail}
          className="w-full rounded-md bg-slate-900 px-4 py-4 text-lg font-medium text-white disabled:bg-slate-300"
        >
          Send the interest meeting link
        </button>
        <p className="mt-3 text-sm text-slate-600">
          They get your booking calendar and a short note asking what they are
          looking for. Signed by you, and replies come back to you.
        </p>
      </form>
    </main>
  );
}
