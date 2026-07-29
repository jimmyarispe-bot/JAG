import { AdmissionsPublicShell } from "@/components/admissions/experience/AdmissionsPublicShell";
import { SchedulingRequestForm } from "@/components/admissions/experience/SchedulingRequestForm";
import { getSchoolsForInquiry } from "@/lib/admissions/portal/queries";

export default async function AssessmentRequestPage() {
  const schools = await getSchoolsForInquiry();
  return (
    <AdmissionsPublicShell
      title="Assessment request"
      subtitle="Share student profile and areas of concern. Scheduling and status track in Admissions CRM; pedagogy signals use Learning Intelligence."
    >
      <SchedulingRequestForm schools={schools} mode="assessment" />
    </AdmissionsPublicShell>
  );
}
