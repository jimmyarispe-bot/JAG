import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { ParentProfileForm } from "@/components/portal/experience/ParentProfileForm";

export default async function ParentProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/profile");

  const supabase = await createAuthClient();
  const { data: guardian } = await supabase
    .from("guardians")
    .select("id, first_name, last_name, email, phone, family_id, relationship")
    .eq("user_id", sessionUser.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">
          Guardian information, household, communication and notification preferences — Identity
          preferences service.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Guardian</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd>
              {guardian
                ? `${guardian.first_name ?? ""} ${guardian.last_name ?? ""}`.trim() || "—"
                : sessionUser.email}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{guardian?.email ?? sessionUser.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd>{guardian?.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Relationship</dt>
            <dd>{guardian?.relationship ?? "Guardian"}</dd>
          </div>
        </dl>
      </section>

      <ParentProfileForm
        userId={sessionUser.id}
        defaults={{
          language: "en",
          notification_email: true,
          notification_sms: false,
        }}
      />
    </div>
  );
}
