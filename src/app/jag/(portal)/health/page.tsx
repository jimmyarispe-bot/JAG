import { redirect } from "next/navigation";
import { JagPlatformHealthDashboard } from "@/components/jag-platform/JagPlatformHealthDashboard";
import { canViewPlatformHealth } from "@/lib/jag-platform/admin-access";
import { JAG_PLATFORM_HOME_PATH, JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getPlatformHealthSnapshot } from "@/lib/jag-platform/health";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagPlatformHealthPage() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  if (!canViewPlatformHealth(session)) {
    redirect(JAG_PLATFORM_HOME_PATH);
  }

  return <JagPlatformHealthDashboard health={getPlatformHealthSnapshot()} />;
}
