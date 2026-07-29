import { notFound, redirect } from "next/navigation";
import { JagEvidenceJobDetail } from "@/components/jag-platform/JagEvidenceJobDetail";
import {
  canAccessEvidenceOrganization,
  getEvidenceForOrganization,
  getProcessingJobForOrganization,
  listEventsForJob,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagEvidenceJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const { jobId } = await params;
  const query = await searchParams;
  const org = resolveEvidenceOrganization(session, query.org);
  if (!org || !canAccessEvidenceOrganization(session, org.id)) {
    notFound();
  }

  const job = getProcessingJobForOrganization(org.id, jobId);
  if (!job) {
    notFound();
  }

  const events = listEventsForJob(org.id, jobId);
  const evidence = getEvidenceForOrganization(org.id, job.evidenceId) ?? null;

  return (
    <JagEvidenceJobDetail
      organizationId={org.id}
      job={job}
      events={events}
      evidence={evidence}
    />
  );
}
