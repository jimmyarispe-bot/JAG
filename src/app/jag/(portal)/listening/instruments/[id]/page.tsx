import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagErrorState } from "@/components/jag/command-center";
import { ListeningInstrumentView } from "@/components/jag/command-center/listening";
import { loadInstrumentDetail } from "@/lib/jag-command-center/listening";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Listening Instrument",
};

export default async function JagListeningInstrumentPage({
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
  const loaded = await loadInstrumentDetail(id, org);
  if (!loaded.ok) {
    return <JagErrorState title="Instrument unavailable" description={loaded.error} />;
  }
  return (
    <ListeningInstrumentView
      organizationId={loaded.organizationId}
      canManage={loaded.canManage}
      instrument={loaded.instrument}
      versions={loaded.versions}
    />
  );
}
