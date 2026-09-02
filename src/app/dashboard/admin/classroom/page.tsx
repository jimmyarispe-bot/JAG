import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { readClassroomLive } from "@/lib/platform/integrations/connectors/education/services/classroom-live";

export const metadata = {
  title: "Google Classroom",
  description: "Live courses and rosters read directly from Google Classroom",
};

export const dynamic = "force-dynamic";

const CLASSROOM_PERMISSION = "school.configure" as const;

/**
 * The proof page.
 *
 * Everything on it comes from a live call to Google at request time — nothing is
 * cached, stored, or derived from a fixture. If Classroom is not reachable this
 * page says why in words that name the fix, rather than rendering an empty table
 * that could equally mean "no courses" or "never connected". That ambiguity is
 * the failure this whole piece of work exists to remove.
 */
export default async function ClassroomPage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");

  if (!hasPermission(identity, CLASSROOM_PERMISSION)) {
    const roles = identity.roles?.length ? identity.roles.join(", ") : "none";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Google Classroom"
          subtitle="You do not have access to this page"
          backHref="/dashboard/admin"
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            This page needs the <span className="font-mono">{CLASSROOM_PERMISSION}</span> permission.
          </p>
          <p className="mt-1">
            The roles on your account are: <span className="font-mono">{roles}</span>
          </p>
        </div>
      </div>
    );
  }

  const result = await readClassroomLive();

  if (!result.ok) {
    const heading =
      result.reason === "not_configured"
        ? "Google is not configured"
        : result.reason === "not_connected"
          ? "Google Workspace is not connected"
          : result.reason === "scope"
            ? "Reconnect required"
            : "Could not read Classroom";

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Google Classroom"
          subtitle="Live courses and rosters"
          backHref="/dashboard/admin"
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-semibold">{heading}</p>
          <p className="mt-2 whitespace-pre-wrap">{result.message}</p>
          {result.reason !== "not_configured" ? (
            <p className="mt-3">
              Google Workspace settings:{" "}
              <a className="font-medium underline" href="/settings/integrations/google">
                /settings/integrations/google
              </a>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const totalStudents = result.courses.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Google Classroom"
        subtitle="Read live from Google at page load — nothing here is stored in JAG yet"
        backHref="/dashboard/admin"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Courses</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{result.courses.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Enrollments</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Fetched</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {new Date(result.fetchedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {result.courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-sm text-slate-600">
          Google answered, and this account has no active courses. That is a real answer, not a
          failure — if you expected courses here, check that the connected Google account is a
          member of them.
        </div>
      ) : (
        <div className="space-y-4">
          {result.courses.map((course) => (
            <section key={course.id} className="rounded-2xl border border-slate-100 bg-white">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{course.name}</h2>
                  {course.section ? (
                    <p className="text-sm text-slate-500">{course.section}</p>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500">
                  {course.teachers.length ? course.teachers.join(", ") : "No teacher listed"} ·{" "}
                  {course.studentCount} student{course.studentCount === 1 ? "" : "s"}
                </p>
              </header>
              {course.students.length ? (
                <ul className="grid gap-x-6 gap-y-1 px-4 py-3 text-sm text-slate-700 sm:grid-cols-2">
                  {course.students.map((s) => (
                    <li key={`${course.id}-${s.email || s.name}`} className="flex justify-between gap-3">
                      <span>{s.name || "(no name)"}</span>
                      <span className="truncate text-slate-400">{s.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-slate-500">No students enrolled.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
