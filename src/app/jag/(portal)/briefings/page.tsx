import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagBriefingsView } from "@/components/jag/command-center/briefings";
import { JagSection } from "@/components/jag/command-center";
import { loadBriefingList } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Executive Briefings · JAG",
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
  const model = loadBriefingList(session, {
    organizationId: params.org,
  });

  return (
    <Suspense
      fallback={
        <JagSection title="Executive Briefings" description="Loading…">
          <div className="h-40 animate-pulse rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)]" />
        </JagSection>
      }
    >
      <JagBriefingsView model={model} />
    </Suspense>
  );
}
