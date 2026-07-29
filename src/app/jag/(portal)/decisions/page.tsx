import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagDecisionCenterView } from "@/components/jag/command-center/decisions";
import { JagSection } from "@/components/jag/command-center";
import {
  loadDecisionCenter,
  type JagDecisionFilters,
  type JagDecisionGroup,
  type JagDecisionPriorityLabel,
  type JagDecisionStatus,
  JAG_DECISION_GROUPS,
  JAG_DECISION_STATUSES,
} from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagDecisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;
  const filters = parseFilters(params);

  return (
    <Suspense fallback={<Loading />}>
      <JagDecisionCenterView model={loadDecisionCenter(session, filters)} />
    </Suspense>
  );
}

function parseFilters(
  params: Record<string, string | undefined>
): JagDecisionFilters {
  const priority = params.priority;
  const status = params.status;
  const group = params.group;

  return {
    priority: isPriority(priority) ? priority : "all",
    organizationId: params.org || "all",
    domainId: params.domain || "all",
    capabilityPackId: params.pack || "all",
    status: isStatus(status) ? status : "all",
    contributorId: params.contributor || "all",
    group: isGroup(group) ? group : "all",
    q: params.q,
  };
}

function isPriority(v?: string): v is JagDecisionPriorityLabel {
  return v === "P1" || v === "P2" || v === "P3";
}

function isStatus(v?: string): v is JagDecisionStatus {
  return Boolean(v && (JAG_DECISION_STATUSES as readonly string[]).includes(v));
}

function isGroup(v?: string): v is JagDecisionGroup {
  return Boolean(v && (JAG_DECISION_GROUPS as readonly string[]).includes(v));
}

function Loading() {
  return (
    <JagSection title="Decision Center" description="Loading queue…">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)]"
          />
        ))}
      </div>
    </JagSection>
  );
}
