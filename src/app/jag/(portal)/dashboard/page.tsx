import { redirect } from "next/navigation";
import { JagDashboard } from "@/components/jag-platform/JagDashboard";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagDashboardPage() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  const organizations = listOrganizationsForSession(session);
  return <JagDashboard organizations={organizations} />;
}
