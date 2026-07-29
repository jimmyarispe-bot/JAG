import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagCard, JagOverviewGrid } from "@/components/jag/command-center";
import type { JagOverviewCardModel } from "@/components/jag/command-center";
import { loadJagCommandCenterOverview } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagCommandCenterPage() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  return (
    <Suspense fallback={<OverviewLoadingFallback />}>
      <OverviewContent />
    </Suspense>
  );
}

async function OverviewContent() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  const { cards } = loadJagCommandCenterOverview(session);
  return <JagOverviewGrid cards={cards} />;
}

function OverviewLoadingFallback() {
  const cards: JagOverviewCardModel[] = [
    "Organization Health",
    "Executive Brief",
    "Domains",
    "Capability Packs",
    "Runtime Status",
    "Planner",
    "Orchestrator",
    "Policy Engine",
    "Knowledge Model",
    "Observability",
  ].map((title, index) => ({
    id: `loading-${index}`,
    title,
    status: "loading" as const,
    summary: "",
  }));

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {cards.map((card) => (
        <JagCard key={card.id} card={card} />
      ))}
    </div>
  );
}
