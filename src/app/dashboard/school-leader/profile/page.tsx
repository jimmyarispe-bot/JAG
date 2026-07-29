import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { SchoolLeaderProfileForm } from "@/components/school-leader/experience/SchoolLeaderProfileForm";

export default async function SchoolLeaderProfilePage() {
  const ctx = await requireSchoolLeaderExperienceContext();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">
          Campus preferences, notifications, and delegated permission notes — Identity preferences.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-semibold">Leader</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-slate-700">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd>{ctx.identity.fullName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd>{ctx.identity.roleLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">School</dt>
            <dd className="font-mono text-xs">{ctx.schoolId ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <SchoolLeaderProfileForm
        userId={ctx.actorUserId}
        organizationId={ctx.organizationId}
      />
    </div>
  );
}
