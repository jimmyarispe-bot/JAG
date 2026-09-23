import { ApplyShell } from "@/components/admissions/portal/ApplyShell";
import { TokenApplicationForm } from "@/components/admissions/apply-link/TokenApplicationForm";
import { openApplicationByToken } from "@/lib/admissions/apply-link/token-access";

/**
 * The application, opened from the link in the invitation. No account.
 *
 * There is no getSessionUser() in this file and that is the point. Every other
 * route under /apply/portal begins by redirecting anyone without a session to
 * /login, which is how a family invited to apply ended up at a password box.
 *
 * Not indexed: a token in a URL should not end up in a search result.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

interface ApplyStartPageProps {
  params: Promise<{ token: string }>;
}

export default async function ApplyStartPage({ params }: ApplyStartPageProps) {
  const { token } = await params;
  const context = await openApplicationByToken(token);

  /*
   * One message for every failure - unknown, malformed, revoked - and it does
   * not say which. Telling somebody guessing tokens that they are getting warm
   * is the only thing this page could get badly wrong.
   *
   * It is also written for the innocent case, which is by far the likeliest:
   * a parent whose link was re-issued, or who clicked an older email.
   */
  if (!context) {
    return (
      <ApplyShell showNav={false}>
        <div className="mx-auto max-w-lg space-y-3 py-12 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            This link is no longer active
          </h1>
          <p className="text-slate-600">
            It may have been replaced by a newer one. Please check for a more
            recent email from us, or reply to the invitation and we will send
            you a fresh link.
          </p>
        </div>
      </ApplyShell>
    );
  }

  if (context.submitted) {
    return (
      <ApplyShell showNav={false}>
        <div className="mx-auto max-w-lg space-y-3 py-12 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {context.studentName}&apos;s application is already in
          </h1>
          <p className="text-slate-600">
            We have it, and we have emailed you a link to choose shadow days. If
            you need to change something, reply to that email and we will help.
          </p>
        </div>
      </ApplyShell>
    );
  }

  return (
    <ApplyShell organizationName={context.schoolName} showNav={false}>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {context.studentName}&apos;s application to {context.schoolName}
          </h1>
          <p className="mt-2 text-slate-600">
            Hello {context.guardianName}. There are seven questions and nothing
            here is a test — we are trying to understand your child well enough
            to teach them. You can save and come back to this same link at any
            point.
          </p>
        </div>

        <TokenApplicationForm
          token={token}
          studentName={context.studentName}
          values={context.values}
        />
      </div>
    </ApplyShell>
  );
}
