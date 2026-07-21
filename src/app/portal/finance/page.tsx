import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getGuardianFamilyFinancialProfiles } from "@/lib/finance/family-center";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { FamilyFinancialCenter } from "@/components/finance/FamilyFinancialCenter";
import { ActionChip } from "@/components/ui/cta";

export default async function PortalFinancePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/finance");

  const supabase = await createAuthClient();
  const profiles = await getGuardianFamilyFinancialProfiles(supabase, sessionUser.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Center</h1>
        <p className="mt-1 text-slate-600">Invoices, payments, AutoPay, scholarships, state funding, and agreements.</p>
      </div>
      {!profiles.length && (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No billing account linked yet.{" "}
          <ActionChip href="/apply/portal/finance" size="xs" className="inline-flex align-middle">
            View admissions billing
          </ActionChip>
        </p>
      )}
      {profiles.map((profile) => (
        <div key={profile.family.id as string}>
          <h2 className="mb-4 text-xl font-semibold">{profile.family.family_name as string}</h2>
          <FamilyFinancialCenter
            familyId={profile.family.id as string}
            profile={profile as Parameters<typeof FamilyFinancialCenter>[0]["profile"]}
            portalMode
          />
        </div>
      ))}
    </div>
  );
}
