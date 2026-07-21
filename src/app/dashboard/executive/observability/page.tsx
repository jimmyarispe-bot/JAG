import { createAuthClient } from "@/lib/supabase/server-auth";
import { getProductionObservabilitySnapshot } from "@/lib/production";
import { ObservabilityDashboard } from "@/components/executive/ObservabilityDashboard";

export default async function ExecutiveObservabilityPage() {
  const supabase = await createAuthClient();
  const snapshot = await getProductionObservabilitySnapshot(supabase);
  return (
    <div className="space-y-4 p-1">
      <ObservabilityDashboard snapshot={snapshot} />
    </div>
  );
}
