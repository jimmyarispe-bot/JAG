import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagErrorState, JagLoadingSkeleton } from "@/components/jag/command-center";
import { ListeningLandingView } from "@/components/jag/command-center/listening";
import { loadListeningLanding } from "@/lib/jag-command-center/listening";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Listening · Executive Intelligence Platform",
  description: "Author organizational listening initiatives, instruments, and campaigns.",
};

async function ListeningLandingBody({
  org,
}: {
  readonly org?: string;
}) {
  const loaded = await loadListeningLanding(org);
  if (!loaded.ok) {
    return <JagErrorState title="Listening unavailable" description={loaded.error} />;
  }
  return <ListeningLandingView model={loaded.model} />;
}

export default async function JagListeningPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  const params = await searchParams;

  return (
    <Suspense fallback={<JagLoadingSkeleton />}>
      <ListeningLandingBody org={params.org} />
    </Suspense>
  );
}
