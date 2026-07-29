import { redirect } from "next/navigation";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * Authenticated portal segment — shell is provided by /jag root layout.
 */
export default async function JagPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  return children;
}
