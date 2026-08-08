import { redirect } from "next/navigation";
import { JagOrganizationsPage } from "@/components/jag-platform/JagOrganizationsPage";
import { listOrganizationsForPlatformAdmin } from "@/lib/jag-business/organizations-view";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagOrganizationsRoute() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  return (
    <JagOrganizationsPage
      organizations={listOrganizationsForPlatformAdmin(session)}
    />
  );
}
