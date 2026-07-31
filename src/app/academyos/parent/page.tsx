import { ParentPortal } from "@/components/academyos/ParentPortal";
import {
  createEnrollmentWizardService,
  createParentPortalService,
} from "@academyos";

export default async function AcademyOsParentPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  if (!token) {
    return (
      <div className="p-8 text-sm text-slate-600">
        Parent portal requires an access token.
      </div>
    );
  }

  const resolved = createParentPortalService().resolve(token);
  if ("error" in resolved) {
    return (
      <div className="p-8 text-sm text-rose-700">Invalid or expired token.</div>
    );
  }

  const wizard =
    resolved.applicant != null
      ? createEnrollmentWizardService().getByApplicant(
          resolved.applicant.organizationId,
          resolved.applicant.id
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <ParentPortal
        token={token}
        applicant={resolved.applicant}
        documents={resolved.documents}
        wizard={wizard}
        sis={resolved.sis}
        academic={resolved.academic}
        finance={resolved.finance}
        learning={resolved.learning}
      />
    </main>
  );
}
