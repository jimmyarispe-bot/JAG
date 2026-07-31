import { redirect } from "next/navigation";
import { AdmissionsDashboard } from "@/components/academyos/AdmissionsDashboard";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  buildAdmissionsDashboard,
  createApplicantsService,
  installAcademyOsIndustryPack,
} from "@academyos";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function AcademyOsAdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const params = await searchParams;
  const org = resolveEvidenceOrganization(session, params.org);
  if (!org) {
    return (
      <div className="p-8 text-sm text-slate-600">
        No organization available for AcademyOS Admissions.
      </div>
    );
  }

  installAcademyOsIndustryPack({ organizationId: org.id });
  void listAccessibleEvidenceOrganizations(session);

  const applicants = createApplicantsService().list(org.id);
  const dashboard = buildAdmissionsDashboard(org.id);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <AdmissionsDashboard
        organizationId={org.id}
        organizationName={org.name}
        dashboard={dashboard}
        applicants={applicants}
      />
    </main>
  );
}
