import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { FounderIntelligenceDashboard } from "@/components/founder/FounderIntelligenceDashboard";
import {
  assertCanViewFounderIntelligence,
  canDecideFounderIntelligence,
  composeFounderDashboard,
} from "@/lib/founder-intelligence";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimarySchoolId } from "@/lib/platform/identity/school-access";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

export default function FounderIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl p-6 text-sm text-slate-500">
          Loading Founder Intelligence…
        </div>
      }
    >
      <FounderIntelligencePageContent />
    </Suspense>
  );
}

async function FounderIntelligencePageContent() {
  const ctx = await getIdentityContext();
  const access = assertCanViewFounderIntelligence(ctx);
  if (!access.ok) {
    redirect("/dashboard");
  }

  const supabase = await createAuthClient();
  const schoolId = resolvePrimarySchoolId(access.ctx) ?? null;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  const organizationId = schoolCtx?.organizationId ?? null;

  const bundle = await composeFounderDashboard(supabase, {
    organizationId,
    schoolId,
    seedDecisions: true,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Founder Intelligence"
        subtitle="AI-powered executive layer — risks, opportunities, predictions, and decisions"
      />
      <FounderIntelligenceDashboard
        bundle={bundle}
        canDecide={canDecideFounderIntelligence(access.ctx)}
        organizationId={organizationId}
        schoolId={schoolId}
      />
    </div>
  );
}
