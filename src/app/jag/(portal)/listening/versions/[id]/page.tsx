import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagErrorState } from "@/components/jag/command-center";
import { ListeningVersionView } from "@/components/jag/command-center/listening";
import { loadVersionDetail } from "@/lib/jag-command-center/listening";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Listening Version",
};

export default async function JagListeningVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string; published?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  const { id } = await params;
  const { org, published } = await searchParams;
  const loaded = await loadVersionDetail(id, org);
  if (!loaded.ok) {
    return <JagErrorState title="Version unavailable" description={loaded.error} />;
  }
  return (
    <ListeningVersionView
      organizationId={loaded.organizationId}
      canManage={loaded.canManage}
      version={loaded.version}
      instrument={loaded.instrument}
      questions={loaded.questions as never}
      sections={loaded.sections}
      campaigns={loaded.campaigns}
      estimatedMinutes={loaded.estimatedMinutes}
      justPublished={published === "1"}
    />
  );
}
