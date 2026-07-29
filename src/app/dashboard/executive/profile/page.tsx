import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { ExecutiveProfileForm } from "@/components/executive/experience/ExecutiveProfileForm";

export default async function ExecutiveProfilePage() {
  const ctx = await requireExecutiveExperienceContext();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">
          Preferences, delegation, and notification settings — Identity preferences.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-semibold">Executive</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-slate-700">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd>{ctx.identity.fullName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd>{ctx.identity.roleLabel}</dd>
          </div>
        </dl>
      </section>

      <ExecutiveProfileForm
        userId={ctx.actorUserId}
        organizationId={ctx.organizationId}
      />
    </div>
  );
}
