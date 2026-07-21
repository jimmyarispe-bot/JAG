import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarDashboard } from "@/components/calendar/CalendarDashboard";
import { CreateEventForm } from "@/components/calendar/CreateEventForm";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canEditCalendar,
  canViewCalendar,
  listCalendarOccurrences,
  listResources,
} from "@/lib/calendar";
import type { CalendarView } from "@/lib/calendar/types";

interface PageProps {
  searchParams: Promise<{
    view?: string;
    date?: string;
    studentId?: string;
    familyId?: string;
    teacherId?: string;
    resourceId?: string;
    create?: string;
  }>;
}

const VIEWS: CalendarView[] = ["day", "week", "month", "agenda"];

function normalizeView(value?: string): CalendarView {
  if (value && VIEWS.includes(value as CalendarView)) return value as CalendarView;
  return "week";
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canViewCalendar(identity)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const view = normalizeView(sp.view);
  const anchorDate =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)
      ? sp.date
      : new Date().toISOString().slice(0, 10);

  const schoolId = identity?.accessibleSchoolIds?.[0] ?? null;
  const canEdit = canEditCalendar(identity);

  const [occurrences, resources] = await Promise.all([
    listCalendarOccurrences({
      view,
      anchorDate,
      schoolId,
      studentId: sp.studentId,
      familyId: sp.familyId,
      teacherEmployeeId: sp.teacherId,
      resourceId: sp.resourceId,
      includeInstructionalSessions: true,
    }),
    listResources(schoolId),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Calendar"
        subtitle="Classes, meetings, staff schedules, resources, and school events"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/scheduling"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Academic Operations
            </Link>
            {canEdit ? (
              <Link
                href={`/dashboard/calendar?view=${view}&date=${anchorDate}&create=1`}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                New event
              </Link>
            ) : null}
          </div>
        }
      />

      {sp.create === "1" && canEdit ? (
        <CreateEventForm
          schoolId={schoolId}
          resources={resources}
          defaultDate={anchorDate}
        />
      ) : null}

      <Suspense fallback={<p className="text-sm text-slate-500">Loading calendar…</p>}>
        <CalendarDashboard
          occurrences={occurrences}
          view={view}
          anchorDate={anchorDate}
          canEdit={canEdit}
          studentId={sp.studentId}
          familyId={sp.familyId}
          teacherId={sp.teacherId}
          resourceId={sp.resourceId}
          resources={resources}
        />
      </Suspense>
    </div>
  );
}
