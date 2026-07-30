import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagMemoryView } from "@/components/jag/command-center/memory";
import { loadMemoryWorkspace } from "@/lib/jag-command-center/memory";
import type { MemoryType } from "@/lib/platform/intelligence/memory/index";
import { MEMORY_TYPES } from "@/lib/platform/intelligence/memory/index";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Organizational Memory · JAG",
  description:
    "Institutional memory — decisions, outcomes, lessons, and advisory patterns.",
};

function parseType(raw?: string): MemoryType | "all" | undefined {
  if (!raw || raw === "all") return raw === "all" ? "all" : undefined;
  return (MEMORY_TYPES as readonly string[]).includes(raw)
    ? (raw as MemoryType)
    : undefined;
}

export default async function JagMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    q?: string;
    type?: string;
    outcome?: string;
    facet?: string;
    decisionId?: string;
    contributorId?: string;
    policyId?: string;
    goalId?: string;
    id?: string;
  }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Organizational Memory"
          description="Loading institutional experience…"
          cards={4}
        />
      }
    >
      <MemoryContent params={params} />
    </Suspense>
  );
}

async function MemoryContent({
  params,
}: {
  params: {
    org?: string;
    q?: string;
    type?: string;
    outcome?: string;
    facet?: string;
    decisionId?: string;
    contributorId?: string;
    policyId?: string;
    goalId?: string;
    id?: string;
  };
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const facet =
    params.facet === "risk" || params.facet === "opportunity"
      ? params.facet
      : params.facet === "all"
        ? "all"
        : undefined;

  const model = loadMemoryWorkspace(session, {
    organizationId: params.org,
    q: params.q,
    type: parseType(params.type),
    outcome: params.outcome,
    facet,
    decisionId: params.decisionId,
    contributorId: params.contributorId,
    policyId: params.policyId,
    goalId: params.goalId,
    memoryId: params.id,
  });

  return <JagMemoryView model={model} />;
}
