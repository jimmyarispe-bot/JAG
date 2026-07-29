import { AdmissionsPublicShell } from "@/components/admissions/experience/AdmissionsPublicShell";
import { SchedulingRequestForm } from "@/components/admissions/experience/SchedulingRequestForm";
import { getSchoolsForInquiry } from "@/lib/admissions/portal/queries";

export default async function DiscoveryCallPage() {
  const schools = await getSchoolsForInquiry();
  return (
    <AdmissionsPublicShell
      title="Discovery call"
      subtitle="Book a conversation with admissions. Confirmation and reminder emails follow once staff confirm the calendar slot."
    >
      <SchedulingRequestForm schools={schools} mode="discovery" />
    </AdmissionsPublicShell>
  );
}
