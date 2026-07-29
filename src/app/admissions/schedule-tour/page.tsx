import { AdmissionsPublicShell } from "@/components/admissions/experience/AdmissionsPublicShell";
import { SchedulingRequestForm } from "@/components/admissions/experience/SchedulingRequestForm";
import { getSchoolsForInquiry } from "@/lib/admissions/portal/queries";

export default async function ScheduleTourPage() {
  const schools = await getSchoolsForInquiry();
  return (
    <AdmissionsPublicShell
      title="Schedule a tour"
      subtitle="Request an in-person or virtual campus visit. Admissions confirms, reminds, and can reschedule from the CRM."
    >
      <SchedulingRequestForm schools={schools} mode="tour" />
    </AdmissionsPublicShell>
  );
}
