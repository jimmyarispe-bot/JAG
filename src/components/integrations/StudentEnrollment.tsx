"use client";

import type { StudentEnrollmentWidget } from "@/lib/platform/integrations/connectors/enterprise/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function StudentEnrollment({
  widget,
  className,
}: {
  widget: StudentEnrollmentWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Students</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.activeStudents}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Attendance</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.attendanceRate}%</dd>
        </div>
      </dl>
    </section>
  );
}
