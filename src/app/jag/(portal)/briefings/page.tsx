import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagBriefingsView } from "@/components/jag/command-center/briefings";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { loadBriefingList } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Executive Briefings",
  description:
    "Evidence-backed executive briefings synthesized from Command Center intelligence.",
};

export default async function JagBriefingsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Executive Briefings"
          description="Loading briefing archive…"
          cards={4}
        />
      }
    >
      <BriefingsContent organizationId={params.org} />
    </Suspense>
  );
}

async function BriefingsContent({
  organizationId,
}: {
  organizationId?: string;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  const model = loadBriefingList(session, { organizationId });
  return <JagBriefingsView model={model} />;
}
