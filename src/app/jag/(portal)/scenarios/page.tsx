import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagScenarioPlannerView } from "@/components/jag/command-center/scenarios";
import { loadScenarioPlanner } from "@/lib/jag-command-center";
import {
  SCENARIO_KINDS,
  type ScenarioKind,
} from "@/lib/platform/intelligence/scenarios";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Scenario Planner · JAG",
  description:
    "Advisory scenario planning — model hypothetical changes before decisions.",
};

function parseKinds(raw: string | string[] | undefined): ScenarioKind[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values.filter((k): k is ScenarioKind =>
    (SCENARIO_KINDS as readonly string[]).includes(k)
  );
}

export default async function JagScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; kind?: string | string[]; compare?: string }>;
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
          title="Scenario Planner"
          description="Loading scenario templates…"
          cards={4}
        />
      }
    >
      <ScenariosContent
        organizationId={params.org}
        kinds={parseKinds(params.kind)}
        compare={params.compare !== "0"}
      />
    </Suspense>
  );
}

async function ScenariosContent({
  organizationId,
  kinds,
  compare,
}: {
  organizationId?: string;
  kinds: ScenarioKind[];
  compare: boolean;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadScenarioPlanner(session, {
    organizationId,
    runKinds: kinds,
    compare,
  });

  return <JagScenarioPlannerView model={model} />;
}
