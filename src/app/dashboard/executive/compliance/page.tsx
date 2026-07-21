import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getComplianceCenter } from "@/lib/executive/insights";
import { getSchools } from "@/lib/hr/queries";
import { ListSkeleton } from "@/components/experience-system";

const ComplianceCenterPanel = dynamic(
  () =>
    import("@/components/executive/panels/ComplianceCenterPanel").then((m) => ({
      default: m.ComplianceCenterPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={6} label="Loading compliance…" /> }
);

export default async function ExecutiveCompliancePage() {
  const ctx = await getIdentityContext();
  const schoolId =
    ctx?.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx?.accessibleSchoolIds[0];

  const supabase = await createAuthClient();
  const [items, schools] = await Promise.all([
    getComplianceCenter(supabase, schoolId),
    getSchools(),
  ]);

  return <ComplianceCenterPanel items={items} schools={schools} />;
}
