import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagStrategyView } from "@/components/jag/command-center/strategy";
import { loadStrategyWorkspace } from "@/lib/jag-command-center/strategy";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Strategic Intelligence",
  description:
    "Mission, pillars, goal health, and alignment — strategic execution workspace.",
};

export default async function JagStrategyPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Strategic Intelligence"
          description="Loading mission alignment…"
          cards={4}
        />
      }
    >
      <StrategyContent org={params.org} />
    </Suspense>
  );
}

async function StrategyContent({ org }: { org?: string }) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadStrategyWorkspace(session, { organizationId: org });
  return <JagStrategyView model={model} />;
}
