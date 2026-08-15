import { notFound, redirect } from "next/navigation";
import { JagEvidenceDetail } from "@/components/jag-platform/JagEvidenceDetail";
import {
  canAccessEvidenceOrganization,
  getRelationshipsForOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import { loadDurableEvidenceDocument } from "@/lib/evidence-center/load-durable";
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

  const loaded = await loadDurableEvidenceDocument({
    organizationId: org.id,
    organizationName: org.name,
    documentId: id,
  });
  if (!loaded.document) {
    notFound();
  }

  const relationships = getRelationshipsForOrganization(org.id, id);

  return (
    <JagEvidenceDetail
      document={loaded.document}
      organizationId={org.id}
      versions={loaded.versions}
      relationships={relationships}
      catalogOptions={loaded.catalogOptions}
    />
  );
}
