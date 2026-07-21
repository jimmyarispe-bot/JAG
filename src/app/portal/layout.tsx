import { redirect } from "next/navigation";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser } from "@/lib/auth/auth-user";
import { getSessionUser } from "@/lib/auth/session";
import {
  canAccessParentPortal,
  canAccessStudentPortal,
  getParentLinkedStudentIds,
  getStudentSelfId,
} from "@/lib/platform/identity/portal-access";
import { getUnreadNotificationCount } from "@/lib/portal/notifications";
import { PortalShell } from "@/components/portal/PortalShell";
import { loadOrganizationBranding } from "@/lib/branding";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Sprint P002 — getAuthUser/getSessionUser/branding are request-cached (shared with pages).
  const { supabase, user } = await getAuthUser();
  const sessionUser = await getSessionUser();

  if (!user || !sessionUser) redirect("/login?next=/portal");

  redirectIfPasswordResetRequired(user, "/portal");
  const [isParent, isStudent, studentIds, selfId, unread, branding] = await Promise.all([
    canAccessParentPortal(supabase, sessionUser.id),
    canAccessStudentPortal(supabase, sessionUser.id),
    getParentLinkedStudentIds(supabase, sessionUser.id),
    getStudentSelfId(supabase, sessionUser.id),
    getUnreadNotificationCount(supabase, sessionUser.id),
    loadOrganizationBranding(supabase),
  ]);

  // A.1 — permission gate only (linkage is data scope, not an alternate entry path).
  if (!isParent && !isStudent) {
    redirect("/apply/portal");
  }

  const mode = isStudent && !isParent ? "student" : "parent";

  let students: { id: string; first_name: string; last_name: string }[] = [];
  if (studentIds.length) {
    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .in("id", studentIds);
    students = data ?? [];
  }

  return (
    <PortalShell
      userEmail={sessionUser.email}
      mode={mode}
      students={students}
      unreadNotifications={unread}
      productName={branding.productName}
    >
      {children}
    </PortalShell>
  );
}
