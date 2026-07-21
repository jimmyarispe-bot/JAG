"use client";

import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import {
  createProjectAction,
  createTaskAction,
  executePlaybookAction,
} from "@/lib/work/actions";

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm";

export function CreateTaskForm({
  schoolId,
  projects,
}: {
  schoolId?: string;
  projects: { id: string; name: string }[];
}) {
  return (
    <ExperienceForm
      action={createTaskAction}
      verb="create"
      labels={{ idle: "Create task", loading: "Creating…", success: "✓ Created" }}
      progressLabel="Creating task…"
      successToast="✓ Task created."
      errorToast="Unable to create task."
      className="rounded-2xl border border-slate-200 bg-white p-5"
      buttonClassName="mt-3"
    >
      <h2 className="font-semibold">New task</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="title" required placeholder="Task title" className={inputClass} />
        <select name="project_id" className={inputClass}>
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="due_date" type="date" className={inputClass} />
        <select name="priority" className={inputClass}>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        {schoolId && <input type="hidden" name="school_id" value={schoolId} />}
      </div>
    </ExperienceForm>
  );
}

export function CreateProjectForm({
  schools,
}: {
  schools: { id: string; name: string }[];
}) {
  return (
    <ExperienceForm
      action={createProjectAction}
      verb="create"
      labels={{ idle: "Create project", loading: "Creating…", success: "✓ Created" }}
      progressLabel="Creating project…"
      successToast="✓ Project created."
      errorToast="Unable to create project."
      className="rounded-2xl border border-slate-200 bg-white p-5"
      buttonClassName="mt-3"
    >
      <h2 className="font-semibold">New project</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="name" required placeholder="Project name" className={inputClass} />
        <select name="project_type" className={inputClass}>
          <option value="custom">Custom</option>
          <option value="admissions">Admissions</option>
          <option value="enrollment">Enrollment</option>
          <option value="hiring">Hiring</option>
          <option value="compliance">Compliance</option>
          <option value="grant">Grant</option>
          <option value="strategic_plan">Strategic Plan</option>
        </select>
        <select name="school_id" className={inputClass}>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="target_date" type="date" className={inputClass} />
      </div>
    </ExperienceForm>
  );
}

export function RunPlaybookForm({
  playbookId,
  schoolId,
}: {
  playbookId: string;
  schoolId?: string;
}) {
  return (
    <ExperienceForm
      action={executePlaybookAction}
      verb="run"
      labels={{ idle: "Run playbook", loading: "Running…", success: "✓ Started" }}
      progressLabel="Running playbook…"
      successToast="✓ Playbook started."
      errorToast="Unable to run playbook."
      className="mt-4"
      buttonClassName="!rounded-lg !px-3 !py-1.5 !text-sm"
    >
      <input type="hidden" name="playbook_id" value={playbookId} />
      {schoolId && <input type="hidden" name="school_id" value={schoolId} />}
    </ExperienceForm>
  );
}
