import { JagOrganizationsPage } from "@/components/jag-platform/JagOrganizationsPage";
import { listOrganizationsForPlatformAdmin } from "@/lib/jag-business/organizations-view";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export default async function JagOrganizationsRoute() {
  const session = await requireJagPlatformAdminSession();
  return (
    <JagOrganizationsPage
      organizations={listOrganizationsForPlatformAdmin(session)}
    />
  );
}
