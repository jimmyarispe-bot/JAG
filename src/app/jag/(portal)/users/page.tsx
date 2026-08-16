import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagPlatformUsersView } from "@/components/jag-platform/JagPlatformUsersView";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";
import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";
import { listJagPlatformUsers } from "@/lib/jag-platform/platform-users";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { userHasPermission } from "@/lib/platform/identity/permissions";

export const metadata: Metadata = {
  title: "JAG Platform Users",
  description: "Platform identities and access to The JAG. Not AcademyOS organization administration.",
};

export const dynamic = "force-dynamic";

export default async function JagPlatformUsersPage() {
  await requireJagPlatformAdminSession();
  const supabase = await createAuthClient();
  const allowed = await userHasPermission(supabase, "JAG_PLATFORM_ADMIN");
  if (!allowed) {
    redirect(JAG_PLATFORM_HOME_PATH);
  }

  const listed = await listJagPlatformUsers();
  const users = listed.success ? listed.users : [];

  return (
    <JagPlatformUsersView
      users={users}
      loadError={listed.success ? null : listed.error}
    />
  );
}
