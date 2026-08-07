import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JagErrorState, JagLoadingSkeleton } from "@/components/jag/command-center";
import { ListeningIntelligenceWorkbench } from "@/components/jag/command-center/listening/intelligence/ListeningIntelligenceWorkbench";
import { loadListeningIntelligenceWorkbench } from "@/lib/jag-command-center/listening/load-intelligence";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Listening Intelligence · Executive Intelligence Platform",
  description:
    "Evidence-backed listening analysis workbench — deterministic findings only.",
};

async function IntelligenceBody({
  search,
}: {
  readonly search: Record<string, string | undefined>;
}) {
  const loaded = await loadListeningIntelligenceWorkbench(search.org, search);
  if (!loaded.ok) {
    return (
      <JagErrorState
        title="Listening Intelligence unavailable"
        description={loaded.error}
      />
    );
  }
  return <ListeningIntelligenceWorkbench model={loaded.model} />;
}

export default async function JagListeningIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  const search = await searchParams;

  return (
    <Suspense fallback={<JagLoadingSkeleton />}>
      <IntelligenceBody search={search} />
    </Suspense>
  );
}
