"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import { StudentLifecycleActions } from "@/components/students/StudentLifecycleActions";
import {
  recordBehaviorEvent,
  recordStudentAttendance,
  refreshStudentSuccessScore,
  transitionStudentStage,
} from "@/lib/ssis/actions";

interface StudentSuccessQuickActionsProps {
  studentId: string;
  lifecycleStage: string;
  isArchived?: boolean;
  canManageLifecycle?: boolean;
}

export function StudentSuccessQuickActions({
  studentId,
  lifecycleStage,
  isArchived = false,
  canManageLifecycle = false,
}: StudentSuccessQuickActionsProps) {
  const refreshAction = useActionFeedback({
    verb: "run",
    labels: { idle: "Refresh Success Score", loading: "Refreshing…", success: "✓ Refreshed" },
    successToast: "✓ Success score refreshed.",
    errorToast: "Unable to refresh score.",
    progressLabel: "Refreshing success score…",
  });

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
      <p className="mt-1 text-xs text-slate-500">Record attendance, behavior, or advance lifecycle stage.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ExperienceForm
          action={recordStudentAttendance}
          verb="save"
          labels={{ idle: "Record", loading: "Recording…", success: "✓ Recorded" }}
          progressLabel="Recording attendance…"
          successToast="✓ Attendance recorded."
          errorToast="Unable to record attendance."
          className="space-y-2 rounded-xl bg-slate-50 p-3"
          buttonClassName="w-full"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <p className="text-xs font-medium uppercase text-slate-500">Attendance</p>
          <select name="status" className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" required>
            <option value="present">Present</option>
            <option value="virtual_present">Virtual Present</option>
            <option value="therapy_present">Therapy Present</option>
            <option value="absent_excused">Absent (Excused)</option>
            <option value="absent_unexcused">Absent (Unexcused)</option>
            <option value="tardy">Tardy</option>
            <option value="early_dismissal">Early Dismissal</option>
          </select>
          <select name="attendance_context" className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
            <option value="daily">Daily</option>
            <option value="virtual">Virtual</option>
            <option value="therapy">Therapy</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" name="notify_parent" value="true" />
            Notify parent
          </label>
        </ExperienceForm>

        <ExperienceForm
          action={recordBehaviorEvent}
          verb="create"
          labels={{ idle: "Log Event", loading: "Logging…", success: "✓ Logged" }}
          progressLabel="Logging behavior event…"
          successToast="✓ Behavior event logged."
          errorToast="Unable to log event."
          className="space-y-2 rounded-xl bg-slate-50 p-3"
          buttonClassName="w-full"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <p className="text-xs font-medium uppercase text-slate-500">Behavior</p>
          <select name="event_type" className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" required>
            <option value="positive">Positive</option>
            <option value="incident">Incident</option>
            <option value="intervention">Intervention</option>
            <option value="restorative">Restorative</option>
          </select>
          <input
            name="title"
            placeholder="Title"
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            required
          />
        </ExperienceForm>

        <ExperienceForm
          action={transitionStudentStage}
          verb="save"
          labels={{ idle: "Transition", loading: "Updating…", success: "✓ Updated" }}
          progressLabel="Updating lifecycle stage…"
          successToast="✓ Lifecycle stage updated."
          errorToast="Unable to transition stage."
          className="space-y-2 rounded-xl bg-slate-50 p-3"
          buttonClassName="w-full !bg-slate-800 hover:!bg-slate-900"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <p className="text-xs font-medium uppercase text-slate-500">Lifecycle</p>
          <p className="text-xs text-slate-600">Current: <span className="capitalize">{lifecycleStage}</span></p>
          <select name="to_stage" className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" required>
            <option value="active">Active Student</option>
            <option value="graduating">Graduating</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="alumni">Alumni</option>
          </select>
        </ExperienceForm>
      </div>

      <ActionButton
        type="button"
        status={refreshAction.status}
        verb="run"
        variant="secondary"
        size="sm"
        labels={{ idle: "Refresh Success Score", loading: "Refreshing…", success: "✓ Refreshed" }}
        className="mt-4"
        errorMessage={refreshAction.errorMessage}
        onClick={() => {
          void refreshAction.run(async () => {
            const result = await refreshStudentSuccessScore(studentId);
            assertActionResult(result);
            return result ?? { success: true };
          });
        }}
      />

      {canManageLifecycle && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase text-slate-500">Admin</p>
          <StudentLifecycleActions
            studentId={studentId}
            isArchived={isArchived}
            variant="header"
          />
        </div>
      )}
    </div>
  );
}
