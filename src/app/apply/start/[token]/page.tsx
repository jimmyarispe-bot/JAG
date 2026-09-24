import { ApplyShell } from "@/components/admissions/portal/ApplyShell";
import { InterestFormRenderer } from "@/components/admissions/portal/InterestFormRenderer";
import { leadIdForApplicationToken } from "@/lib/admissions/apply-link/token";
import { prefillValuesForLead } from "@/lib/admissions/interest-form/prefill";
import { loadPublishedInterestForm } from "@/lib/admissions/interest-form/load";
import { resolveInterestFormOrganization } from "@/lib/admissions/interest-form/org-resolve";

/**
 * The application, opened from the link in a school leader's invitation.
 *
 * No getSessionUser() in this file, deliberately. Every route under
 * /apply/portal begins by bouncing anyone without an account to /login, which
 * is how Lisa Roy - invited to apply on 22 September - ended up at a password
 * box. A family being invited to apply is not a user of the school yet.
 *
 * It renders THE SAME published form as /apply. Not a copy, not a subset: the
 * campus sections appear because the definition's own visibleWhen conditions
 * see the family's campus in the prefilled values, exactly as they do when a
 * parent picks a campus from the dropdown.
 *
 * Not indexed: a token in a URL should not turn up in a search result.
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
  const leadId = await leadIdForApplicationToken(token);

  /*
   * One message for every failure - unknown, malformed, revoked - and it does
   * not say which. It is also written for the likeliest case by far: a parent
   * clicking an older email after a newer link was issued.
   */
  if (!leadId) {
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

  const org = await resolveInterestFormOrganization();
  const published = org
    ? await loadPublishedInterestForm({
        organizationId: org.organizationId,
        organizationName: org.organizationName,
      })
    : null;

  if (!published) {
    return (
      <ApplyShell showNav={false}>
        <div className="mx-auto max-w-lg space-y-3 py-12 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            The application is not available right now
          </h1>
          <p className="text-slate-600">
            This is our problem, not yours. Please reply to the invitation and
            we will sort it out.
          </p>
        </div>
      </ApplyShell>
    );
  }

  const initialValues = await prefillValuesForLead(leadId);

  return (
    <ApplyShell organizationName={org?.organizationName} showNav={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Complete your application
          </h1>
          <p className="mt-2 text-slate-600">
            Anything you have already told us is filled in below. Add what is
            missing and send it back — you can close this and return to the
            same link at any point.
          </p>
        </div>

        <InterestFormRenderer
          published={published}
          initialValues={initialValues}
          invitationToken={token}
        />
      </div>
    </ApplyShell>
  );
}
