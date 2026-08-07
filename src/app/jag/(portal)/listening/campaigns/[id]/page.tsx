import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagErrorState } from "@/components/jag/command-center";
import { ListeningCampaignView } from "@/components/jag/command-center/listening";
import { loadCampaignDetail } from "@/lib/jag-command-center/listening";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Listening Campaign · Executive Intelligence Platform",
};

export default async function JagListeningCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  const { id } = await params;
  const { org } = await searchParams;
  const loaded = await loadCampaignDetail(id, org);
  if (!loaded.ok) {
    return <JagErrorState title="Campaign unavailable" description={loaded.error} />;
  }
  return (
    <ListeningCampaignView
      organizationId={loaded.organizationId}
      canManage={loaded.canManage}
      campaign={loaded.campaign}
      responseCount={loaded.responseCount}
    />
  );
}
