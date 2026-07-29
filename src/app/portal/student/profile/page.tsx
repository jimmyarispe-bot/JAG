import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { StudentProfileForm } from "@/components/portal/student-experience/StudentProfileForm";

export default async function StudentProfilePage() {
  const ctx = await requireStudentExperienceContext("/portal/student/profile");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">
          Your information, preferences, accessibility, language, and notifications — Identity
          preferences service.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-semibold text-slate-900">Student information</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-slate-700">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd>
              {ctx.student.first_name} {ctx.student.last_name}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Grade</dt>
            <dd>{ctx.student.grade_level ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Program</dt>
            <dd className="capitalize">
              {ctx.student.program?.replace(/_/g, " ") ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Account email</dt>
            <dd>{ctx.sessionUser.email}</dd>
          </div>
        </dl>
      </section>

      <StudentProfileForm
        userId={ctx.sessionUser.id}
        organizationId={ctx.organizationId}
      />
    </div>
  );
}
