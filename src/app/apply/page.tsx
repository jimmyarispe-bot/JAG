import { ApplyShell } from "@/components/admissions/portal/ApplyShell";
import { InterestFormRenderer } from "@/components/admissions/portal/InterestFormRenderer";
import { loadPublishedInterestForm } from "@/lib/admissions/interest-form/load";
import { resolveInterestFormOrganization } from "@/lib/admissions/interest-form/org-resolve";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding, formatProductTitle } from "@/lib/branding";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);
  return {
    title: formatProductTitle(branding, "Admissions Inquiry"),
    description: "Submit a parent inquiry to begin the admissions process.",
  };
}

export default async function ApplyInquiryPage() {
  const org = await resolveInterestFormOrganization();
  const published = org
    ? await loadPublishedInterestForm({
        organizationId: org.organizationId,
        organizationName: org.organizationName,
      })
    : null;

  return (
    <ApplyShell organizationName={org?.organizationName} showNav={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Start Your Admissions Journey
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Complete this inquiry form to connect with our admissions team from one of our awesome
            schools. After submitting, you will receive an email with a link to signup for a tour,
            in-person, or virtual meeting so we can get to know more about your child&rsquo;s needs.
          </p>
        </div>

        {!org || !published ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            The Express Interest form is not available for this organization yet.
          </div>
        ) : (
          <InterestFormRenderer published={published} />
        )}
      </div>
    </ApplyShell>
  );
}
