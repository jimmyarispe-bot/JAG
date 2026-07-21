import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getParentDashboardData, getLinkedStudentsForPortal } from "@/lib/portal/dashboard";
import { ParentDashboard } from "@/components/portal/ParentDashboard";
import { recordPortalLoginAction } from "@/lib/portal/actions";
import { loadOrganizationBranding, formatProductTitle } from "@/lib/branding";
import { ActionChip } from "@/components/ui/cta";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);
  return { title: formatProductTitle(branding, "Family Portal") };
}

export default async function PortalHomePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal");

  const supabase = await createAuthClient();
  const [students, branding] = await Promise.all([
    getLinkedStudentsForPortal(supabase, sessionUser.id),
    loadOrganizationBranding(supabase),
  ]);

  if (!students.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to {branding.productName}</h1>
        <p className="mt-2 text-slate-600">
          Your enrolled students are not linked yet. Continue admissions or contact the registrar.
        </p>
        <ActionChip href="/apply/portal" size="sm" className="mt-4">
          Go to admissions portal
        </ActionChip>
      </div>
    );
  }

  await recordPortalLoginAction(students.map((s) => s.id));
  const dashboard = await getParentDashboardData(supabase, sessionUser.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Family Dashboard</h1>
        <p className="mt-1 text-slate-600">Everything you need for your children — schedules, progress, finance, and more.</p>
      </div>
      <ParentDashboard
        students={dashboard.students}
        financial={dashboard.financial}
        tasks={dashboard.tasks}
        deadlines={dashboard.deadlines}
        unreadNotifications={dashboard.unreadNotifications}
      />
    </div>
  );
}
