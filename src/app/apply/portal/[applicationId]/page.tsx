import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { ApplyShell } from "@/components/admissions/portal/ApplyShell";
import { ActionChip } from "@/components/ui/cta";
import { AdmissionsProgressMeter } from "@/components/admissions/portal/AdmissionsProgressMeter";
import { FinancialAidSection } from "@/components/admissions/portal/FinancialAidSection";
import { StateFundingVerificationPanel } from "@/components/admissions/portal/StateFundingVerification";
import { SubmitApplicationButton } from "@/components/admissions/portal/SubmitApplicationButton";
import { ListSkeleton } from "@/components/experience-system";

/** P010 — Document Center is a large client island; load only on this portal route. */
const ApplicationDetailsForm = dynamic(
  () =>
    import("@/components/admissions/portal/DocumentCenter").then((m) => ({
      default: m.ApplicationDetailsForm,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={4} label="Loading application details…" /> }
);
const DocumentCenter = dynamic(
  () =>
    import("@/components/admissions/portal/DocumentCenter").then((m) => ({
      default: m.DocumentCenter,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={6} label="Loading documents…" /> }
);
const FinancialAidDocumentCenter = dynamic(
  () =>
    import("@/components/admissions/portal/DocumentCenter").then((m) => ({
      default: m.FinancialAidDocumentCenter,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={4} label="Loading financial aid docs…" /> }
);
import { getSessionUser } from "@/lib/auth/session";
import { computeAdmissionsProgress } from "@/lib/admissions/portal/progress";
import {
  requiresFinancialAid,
  requiresStateFundingVerification,
} from "@/lib/constants/admissions-portal";
import { programLabel } from "@/lib/constants/programs";
import {
  getApplicationDocuments,
  getPortalApplication,
  getScholarshipDocuments,
  getScholarshipForApplication,
  getStateFundingVerifications,
} from "@/lib/admissions/portal/queries";

interface PortalApplicationPageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function PortalApplicationPage({ params }: PortalApplicationPageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?next=/apply/portal");
  }

  const { applicationId } = await params;
  const portalData = await getPortalApplication(applicationId);
  if (!portalData) notFound();

  const { application, fundingCodes } = portalData;
  const lead = application.admissions_leads;

  const [documents, verifications, scholarship] = await Promise.all([
    getApplicationDocuments(applicationId),
    getStateFundingVerifications(applicationId),
    getScholarshipForApplication(applicationId),
  ]);

  const scholarshipDocuments = scholarship
    ? await getScholarshipDocuments(scholarship.id)
    : [];

  const progress = computeAdmissionsProgress({
    application,
    documents,
    verifications,
    scholarship,
    scholarshipDocuments,
    fundingCodes,
  });

  const showStateFunding = requiresStateFundingVerification(fundingCodes);
  const showFinancialAid = requiresFinancialAid(fundingCodes);
  const stateFundingDocs = documents.filter((d) => d.document_subtype === "state_funding");

  return (
    <ApplyShell userEmail={sessionUser.email}>
      <div className="space-y-6">
        <div>
          <ActionChip href="/apply/portal" size="sm" variant="ghost">
            Back to applications
          </ActionChip>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {lead ? `${lead.first_name} ${lead.last_name}` : "Application"}
          </h1>
          <p className="mt-1 text-slate-600">
            {lead?.schools?.name ?? "School"} · {programLabel(lead?.program ?? null)} ·{" "}
            {application.school_years?.name ?? "School Year"}
          </p>
        </div>

        <AdmissionsProgressMeter progress={progress} />

        <ApplicationDetailsForm
          applicationId={applicationId}
          defaults={{
            previous_school: application.previous_school,
            emergency_contact_name: application.emergency_contact_name,
            emergency_contact_phone: application.emergency_contact_phone,
            learning_needs_summary: application.learning_needs_summary,
          }}
        />

        <DocumentCenter
          applicationId={applicationId}
          applicationDocuments={documents}
          stateFundingDocuments={stateFundingDocs}
          showStateFunding={showStateFunding}
        />

        {showStateFunding && (
          <StateFundingVerificationPanel
            applicationId={applicationId}
            leadId={application.lead_id}
            verifications={verifications}
          />
        )}

        {showFinancialAid && (
          <>
            <FinancialAidSection applicationId={applicationId} scholarship={scholarship} />
            {scholarship && (
              <FinancialAidDocumentCenter
                applicationId={applicationId}
                scholarshipApplicationId={scholarship.id}
                documents={scholarshipDocuments}
              />
            )}
          </>
        )}

        <SubmitApplicationButton
          applicationId={applicationId}
          progress={progress}
          applicationStatus={application.application_status}
        />
      </div>
    </ApplyShell>
  );
}
