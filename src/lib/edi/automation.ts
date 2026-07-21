import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { generateAllRecommendations, getTopRecommendations } from "@/lib/edi/recommendation-engine";
import { computeExecutiveScorecard } from "@/lib/edi/scorecard";
import { generateExecutiveBriefings } from "@/lib/edi/briefings";
import { computeCapacitySnapshot } from "@/lib/edi/capacity-planning";
import { computeEducationalRoi } from "@/lib/edi/educational-roi";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const SCHOOL_CONCURRENCY = 3;

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (!items.length) return;
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++]!;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

export async function syncExecutiveDecisionIntelligence(supabase: AuthClient) {
  const { data: schools } = await supabase.from("schools").select("id").limit(50);

  await mapPool(schools ?? [], SCHOOL_CONCURRENCY, async (school) => {
    await Promise.all([
      generateAllRecommendations(supabase, school.id),
      computeExecutiveScorecard(supabase, school.id),
      computeCapacitySnapshot(supabase, school.id),
      computeEducationalRoi(supabase, school.id),
      generateExecutiveBriefings(supabase, school.id),
    ]);
  });

  await syncEdiAlertsToMissionControl(supabase);
}

export async function syncEdiAlertsToMissionControl(supabase: AuthClient) {
  const { data: schools } = await supabase.from("schools").select("id").limit(50);

  await mapPool(schools ?? [], SCHOOL_CONCURRENCY, async (school) => {
    const recs = await getTopRecommendations(supabase, school.id, 30);
    const critical = recs.filter(
      (r) => (r.priority === "critical" || r.riskLevel === "critical") && r.id
    );
    if (!critical.length) return;

    const entityIds = critical.map((r) => r.id as string);
    const { data: existing } = await supabase
      .from("platform_mission_control_items")
      .select("entity_id")
      .eq("entity_type", "edi_recommendations")
      .eq("is_resolved", false)
      .in("entity_id", entityIds);

    const existingIds = new Set((existing ?? []).map((row) => row.entity_id));

    await Promise.all(
      critical
        .filter((rec) => rec.id && !existingIds.has(rec.id))
        .map((rec) =>
          createMissionControlItem(supabase, {
            schoolId: school.id,
            module: "executive",
            itemType: "executive_alert",
            title: `EDI: ${rec.issue}`,
            body: rec.recommendedAction,
            href: "/dashboard/executive/decisions",
            entityType: "edi_recommendations",
            entityId: rec.id,
            assignedRole: rec.decisionOwnerRole ?? "SCHOOL_LEADER",
            severity: rec.priority === "critical" ? "critical" : "high",
          })
        )
    );
  });
}
