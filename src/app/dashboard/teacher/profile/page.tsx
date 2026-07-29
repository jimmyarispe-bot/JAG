import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { TeacherProfileForm } from "@/components/teacher/experience/TeacherProfileForm";

export default async function TeacherProfilePage() {
  const ctx = await requireTeacherExperienceContext();
  const emp = ctx.employee;
  const name =
    (emp as { display_name?: string } | null)?.display_name ||
    `${(emp as { first_name?: string } | null)?.first_name ?? ""} ${(emp as { last_name?: string } | null)?.last_name ?? ""}`.trim() ||
    ctx.identity.fullName;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">
          Availability, teaching preferences, notifications, and meeting links — Identity preferences.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-semibold">Teacher</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-slate-700">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd>{ctx.identity.roleLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Employee id</dt>
            <dd className="font-mono text-xs">{ctx.employeeId}</dd>
          </div>
        </dl>
      </section>

      <TeacherProfileForm
        userId={ctx.actorUserId}
        organizationId={ctx.organizationId}
      />
    </div>
  );
}
