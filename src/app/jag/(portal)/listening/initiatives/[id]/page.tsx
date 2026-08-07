import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagErrorState } from "@/components/jag/command-center";
import { ListeningInitiativeView } from "@/components/jag/command-center/listening";
import { loadInitiativeDetail } from "@/lib/jag-command-center/listening";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Listening Initiative · Executive Intelligence Platform",
};

export default async function JagListeningInitiativePage({
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
  const loaded = await loadInitiativeDetail(id, org);
  if (!loaded.ok) {
    return <JagErrorState title="Initiative unavailable" description={loaded.error} />;
  }
  return (
    <ListeningInitiativeView
      organizationId={loaded.organizationId}
      canManage={loaded.canManage}
      initiative={loaded.initiative}
      instruments={loaded.instruments as never}
      campaigns={loaded.campaigns}
    />
  );
}
