import { notFound, redirect } from "next/navigation";
import { JagEvidenceDetail } from "@/components/jag-platform/JagEvidenceDetail";
import {
  canAccessEvidenceOrganization,
  getEvidenceForOrganization,
  getRelationshipsForOrganization,
  getVersionsForOrganization,
  listEvidenceForOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagEvidenceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const { id } = await params;
  const query = await searchParams;
  const org = resolveEvidenceOrganization(session, query.org);
  if (!org || !canAccessEvidenceOrganization(session, org.id)) {
    notFound();
  }

  const document = getEvidenceForOrganization(org.id, id);
  if (!document) {
    notFound();
  }

  const versions = getVersionsForOrganization(org.id, id);
  const relationships = getRelationshipsForOrganization(org.id, id);
  const catalogOptions = listEvidenceForOrganization(org.id).map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return (
    <JagEvidenceDetail
      document={document}
      organizationId={org.id}
      versions={versions}
      relationships={relationships}
      catalogOptions={catalogOptions}
    />
  );
}
