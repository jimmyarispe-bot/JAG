import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { canViewEdi } from "@/lib/edi/access";
import { ExecutiveNav } from "@/components/executive/ExecutiveNav";
import { ExecutiveWorkspaceNav } from "@/components/executive/experience/ExecutiveWorkspaceNav";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * Wave 1.6 — Executive Workspace product nav over existing EI / org services.
 * Legacy Founder executive links remain available below the product workspace nav.
 */
export default async function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getIdentityContext();
  if (!ctx || (!canAccessExecutiveIntelligence(ctx) && !canViewEdi(ctx))) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6">
      <PageHeader
        title="Executive Workspace"
        subtitle="Organization-wide visibility — finance, strategy, innovation, and operations summaries from canonical platform services"
      />
      <ExecutiveWorkspaceNav />
      <div className="opacity-90">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Intelligence tools
        </p>
        <ExecutiveNav />
      </div>
      {children}
    </div>
  );
}
