"use client";

import {
  createGrowthGoalAction,
  recordInterventionEffectivenessAction,
  recordSessionOutcomeAction,
  scheduleMeetingAction,
  updateGrowthGoalAction,
  addTeamMemberAction,
  completeMeetingAction,
} from "@/lib/instruction/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export function SessionOutcomeForm({ sessionId, studentId }: { sessionId: string; studentId: string }) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save outcomes to Success Profile", loading: "Saving…", success: "✓ Saved" },
    successToast: "✓ Saved",
    progressLabel: "Saving session outcomes…",
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("session_id", sessionId);
        fd.set("student_id", studentId);
        void action.run(async () => {
          const r = await recordSessionOutcomeAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h4 className="font-medium text-slate-900">Session outcomes</h4>
      <textarea name="skills_addressed" placeholder="Skills addressed (one per line)" rows={2} className={inputClass} />
      <textarea name="learning_objectives" placeholder="Learning objectives (one per line)" rows={2} className={inputClass} />
      <textarea name="student_response" placeholder="Student response" rows={2} className={inputClass} />
      <select name="mastery_level" className={inputClass}>
        <option value="">Mastery level…</option>
        <option value="not_demonstrated">Not demonstrated</option>
        <option value="emerging">Emerging</option>
        <option value="developing">Developing</option>
        <option value="proficient">Proficient</option>
        <option value="advanced">Advanced</option>
      </select>
      <textarea name="recommended_next_steps" placeholder="Recommended next steps" rows={2} className={inputClass} />
      <textarea name="homework_practice" placeholder="Homework / practice" rows={2} className={inputClass} />
      <textarea name="follow_up_tasks" placeholder="Follow-up tasks (one per line)" rows={2} className={inputClass} />
      <textarea name="evidence_collected" placeholder="Evidence collected (one per line)" rows={2} className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        labels={{ idle: "Save outcomes to Success Profile", loading: "Saving…", success: "✓ Saved" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}

export function GrowthGoalProgressForm({ goalId, studentId }: { goalId: string; studentId: string }) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Update", loading: "Updating…", success: "✓ Updated" },
    successToast: "✓ Updated",
  });

  return (
    <form
      className="flex flex-wrap items-end gap-2 mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("goal_id", goalId);
        fd.set("student_id", studentId);
        void action.run(async () => {
          const r = await updateGrowthGoalAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <input type="hidden" name="goal_id" value={goalId} />
      <input type="hidden" name="student_id" value={studentId} />
      <input name="progress_pct" type="number" min={0} max={100} placeholder="%" className="w-20 rounded-lg border px-2 py-1 text-sm" />
      <input name="progress_notes" placeholder="Progress note" className="flex-1 min-w-[120px] rounded-lg border px-2 py-1 text-sm" />
      <input name="evidence_note" placeholder="Evidence note" className="flex-1 min-w-[120px] rounded-lg border px-2 py-1 text-sm" />
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        variant="secondary"
        size="xs"
        labels={{ idle: "Update", loading: "Updating…", success: "✓ Updated" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}

export function MeetingScheduleForm({ studentId }: { studentId: string }) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Schedule & log to timeline", loading: "Scheduling…", success: "✓ Scheduled" },
    successToast: "✓ Scheduled",
    progressLabel: "Scheduling meeting…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("student_id", studentId);
        void action.run(async () => {
          const r = await scheduleMeetingAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <h3 className="font-semibold">Schedule meeting</h3>
      <select name="meeting_type" className={inputClass}>
        <option value="parent_conference">Parent conference</option>
        <option value="iep">IEP meeting</option>
        <option value="student_success_team">Student Success Team</option>
        <option value="intervention_review">Intervention review</option>
      </select>
      <input name="title" placeholder="Title" className={inputClass} required />
      <input name="scheduled_at" type="datetime-local" className={inputClass} />
      <textarea name="agenda" placeholder="Agenda" rows={3} className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="create"
        labels={{ idle: "Schedule & log to timeline", loading: "Scheduling…", success: "✓ Scheduled" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}

export function NewGrowthGoalForm({ studentId }: { studentId: string }) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Add goal" },
    successToast: "✓ Created",
    progressLabel: "Creating growth goal…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void action.run(async () => {
          const r = await createGrowthGoalAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <input type="hidden" name="student_id" value={studentId} />
      <h3 className="font-semibold">Add growth goal</h3>
      <select name="goal_source" className={inputClass}>
        <option value="academic">Academic</option>
        <option value="iep">IEP</option>
        <option value="504">504</option>
        <option value="parent">Parent</option>
        <option value="student">Student</option>
        <option value="therapy">Therapy</option>
        <option value="intervention">Intervention</option>
      </select>
      <input name="title" placeholder="Goal title" className={inputClass} required />
      <input name="baseline" placeholder="Baseline" className={inputClass} />
      <input name="target" placeholder="Target" className={inputClass} />
      <input name="success_criteria" placeholder="Success criteria" className={inputClass} />
      <input name="review_date" type="date" className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="create"
        labels={{ idle: "Add goal" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}

const TEAM_ROLES = [
  "classroom_teacher",
  "reading_teacher",
  "math_teacher",
  "structured_literacy_teacher",
  "speech_therapist",
  "occupational_therapist",
  "physical_therapist",
  "counselor",
  "behavior_specialist",
  "school_leader",
  "case_manager",
  "interventionist",
] as const;

export function TeamMemberForm({
  studentId,
  employees,
}: {
  studentId: string;
  employees: { id: string; name: string }[];
}) {
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Add to instructional team", loading: "Adding…", success: "✓ Added" },
    successToast: "✓ Added",
    progressLabel: "Adding team member…",
  });

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("student_id", studentId);
        void action.run(async () => {
          const r = await addTeamMemberAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <input type="hidden" name="student_id" value={studentId} />
      <h3 className="font-semibold">Add team member</h3>
      <select name="employee_id" className={inputClass} required>
        <option value="">Select staff…</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <select name="team_role" className={inputClass} required>
        {TEAM_ROLES.map((role) => (
          <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="is_primary" value="true" />
        Primary contact for this role
      </label>
      <ActionButton
        type="submit"
        status={action.status}
        verb="create"
        labels={{ idle: "Add to instructional team", loading: "Adding…", success: "✓ Added" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}

export function InterventionEffectivenessForm({
  interventionId,
  studentId,
}: {
  interventionId: string;
  studentId: string;
}) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Record", loading: "Recording…", success: "✓ Recorded" },
    successToast: "✓ Recorded",
  });

  return (
    <form
      className="mt-2 flex flex-wrap gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("intervention_id", interventionId);
        fd.set("student_id", studentId);
        void action.run(async () => {
          const r = await recordInterventionEffectivenessAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <input name="minutes_delivered" type="number" placeholder="Minutes" className="w-24 rounded border px-2 py-1 text-sm" />
      <input name="sessions_delivered" type="number" placeholder="Sessions" className="w-24 rounded border px-2 py-1 text-sm" />
      <select name="progress_trend" className="rounded border px-2 py-1 text-sm">
        <option value="">Trend…</option>
        <option value="improving">Improving</option>
        <option value="stable">Stable</option>
        <option value="declining">Declining</option>
      </select>
      <select name="effectiveness_rating" className="rounded border px-2 py-1 text-sm">
        <option value="strong">Strong</option>
        <option value="moderate">Moderate</option>
        <option value="weak">Weak</option>
      </select>
      <input name="outcome_notes" placeholder="Outcome notes" className="min-w-[140px] rounded border px-2 py-1 text-sm" />
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        variant="secondary"
        size="xs"
        labels={{ idle: "Record", loading: "Recording…", success: "✓ Recorded" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}

export function MeetingDocumentationForm({
  meetingId,
  studentId,
}: {
  meetingId: string;
  studentId: string;
}) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Complete & log to timeline", loading: "Saving…", success: "✓ Complete" },
    successToast: "✓ Complete",
    progressLabel: "Documenting meeting…",
  });

  return (
    <form
      className="mt-4 space-y-2 border-t border-slate-100 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("meeting_id", meetingId);
        fd.set("student_id", studentId);
        void action.run(async () => {
          const r = await completeMeetingAction(fd);
          assertActionResult(r);
          return r;
        });
      }}
    >
      <p className="text-xs font-medium text-slate-500">Document meeting</p>
      <textarea name="notes" placeholder="Meeting notes" rows={2} className={inputClass} />
      <textarea name="decisions" placeholder="Decisions" rows={2} className={inputClass} />
      <input name="follow_up_date" type="date" className={inputClass} />
      <input name="task_title" placeholder="Follow-up task" className={inputClass} />
      <input name="task_due_date" type="date" className={inputClass} />
      <ActionButton
        type="submit"
        status={action.status}
        verb="save"
        variant="success"
        labels={{ idle: "Complete & log to timeline", loading: "Saving…", success: "✓ Complete" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
