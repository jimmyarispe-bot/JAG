"use client";

import Link from "next/link";
import {
  duplicateWorkflow,
  publishWorkflow,
  archiveWorkflow,
  createWorkflowDraftFromActive,
  saveWorkflow,
  saveWorkflowStep,
  toggleWorkflow,
} from "@/lib/admissions/automation/server-actions";
import {
  TRIGGER_EVENT_LABELS,
  type WorkflowDefinition,
  type WorkflowStep,
} from "@/lib/admissions/automation/types";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface WorkflowBuilderProps {
  workflows: WorkflowDefinition[];
  selectedWorkflow: WorkflowDefinition | null;
  steps: WorkflowStep[];
  schools: { id: string; name: string }[];
}

export function WorkflowBuilder({
  workflows,
  selectedWorkflow,
  steps,
  schools,
}: WorkflowBuilderProps) {
  const action = useActionFeedback({
    verb: "save",
    successToast: "✓ Changes saved.",
    errorToast: "Unable to update workflow.",
    progressLabel: "Updating workflow…",
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <h3 className="text-sm font-semibold text-slate-900">Workflows</h3>
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className={`rounded-xl border p-4 ${
              selectedWorkflow?.id === wf.id
                ? "border-brand-300 bg-brand-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/dashboard/admissions/workflows?id=${wf.id}`}
                  className="font-medium text-slate-900 hover:text-brand-600"
                >
                  {wf.name}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {TRIGGER_EVENT_LABELS[wf.trigger_event as keyof typeof TRIGGER_EVENT_LABELS] ??
                    wf.trigger_event}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  wf.lifecycle_status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : wf.lifecycle_status === "draft"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {wf.lifecycle_status ?? "active"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton
                type="button"
                status={action.status}
                verb="save"
                variant="ghost"
                size="xs"
                labels={{
                  idle: wf.is_active ? "Disable" : "Enable",
                  loading: "Updating…",
                  success: "✓ Updated",
                }}
                onClick={() => {
                  void action.run(async () => {
                    const r = await toggleWorkflow(wf.id, !wf.is_active);
                    assertActionResult(r);
                    return r;
                  });
                }}
              />
              <ActionButton
                type="button"
                status={action.status}
                verb="create"
                variant="secondary"
                size="xs"
                labels={{ idle: "Duplicate", loading: "Duplicating…", success: "✓ Duplicated" }}
                onClick={() => {
                  void action.run(async () => {
                    const r = await duplicateWorkflow(wf.id);
                    assertActionResult(r);
                    return r;
                  });
                }}
              />
              {wf.lifecycle_status === "draft" && (
                <ActionButton
                  type="button"
                  status={action.status}
                  verb="publish"
                  variant="success"
                  size="xs"
                  labels={{ idle: "Publish", loading: "Publishing…", success: "✓ Published" }}
                  onClick={() => {
                    void action.run(async () => {
                      const r = await publishWorkflow(wf.id);
                      assertActionResult(r);
                      return r;
                    });
                  }}
                />
              )}
              {wf.lifecycle_status === "active" && (
                <>
                  <ActionButton
                    type="button"
                    status={action.status}
                    verb="create"
                    variant="secondary"
                    size="xs"
                    labels={{ idle: "Edit as draft", loading: "Creating…", success: "✓ Created" }}
                    onClick={() => {
                      void action.run(async () => {
                        const r = await createWorkflowDraftFromActive(wf.id);
                        assertActionResult(r);
                        return r;
                      });
                    }}
                  />
                  <ActionButton
                    type="button"
                    status={action.status}
                    verb="delete"
                    variant="danger"
                    size="xs"
                    labels={{ idle: "Archive", loading: "Archiving…", success: "✓ Archived" }}
                    onClick={() => {
                      void action.run(async () => {
                        const r = await archiveWorkflow(wf.id);
                        assertActionResult(r);
                        return r;
                      });
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 lg:col-span-2">
        {selectedWorkflow ? (
          <>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">{selectedWorkflow.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedWorkflow.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                Trigger: {selectedWorkflow.trigger_event} · Category: {selectedWorkflow.category}
                {selectedWorkflow.school_id
                  ? ` · School override`
                  : " · Org-wide"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <h4 className="text-sm font-semibold text-slate-900">Workflow Steps</h4>
              <p className="mt-1 text-xs text-slate-500">
                Trigger → Condition(s) → Action(s) → Delay → Notifications → Completion
              </p>
              <div className="mt-4 space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {index + 1}
                      </span>
                      {index < steps.length - 1 && (
                        <span className="mt-1 h-full w-px bg-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                          {step.step_type}
                        </span>
                        {step.action_type && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                            {step.action_type.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {Object.keys(step.config).length > 0 && (
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-2 text-xs text-slate-600">
                          {JSON.stringify(step.config, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form
              className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void action.run(async () => {
                  const r = await saveWorkflowStep(fd);
                  assertActionResult(r);
                  return r;
                });
              }}
            >
              <h4 className="text-sm font-semibold text-slate-900">Add Step</h4>
              <input type="hidden" name="workflow_id" value={selectedWorkflow.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="step_type" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="action">Action</option>
                  <option value="condition">Condition</option>
                  <option value="delay">Delay</option>
                  <option value="notification">Notification</option>
                  <option value="escalation">Escalation</option>
                </select>
                <select name="action_type" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">—</option>
                  <option value="trigger_communications">Run Communication Templates</option>
                  <option value="create_internal_task">Create Internal Task</option>
                  <option value="send_email">Send Email</option>
                  <option value="send_sms">Send SMS</option>
                  <option value="send_portal_notification">Portal Notification</option>
                  <option value="notify_admissions">Notify Admissions</option>
                  <option value="notify_school_leader">Notify School Leader</option>
                  <option value="generate_enrollment_packet">Generate Enrollment Packet</option>
                  <option value="audit_log_entry">Audit Log Entry</option>
                </select>
              </div>
              <textarea
                name="config"
                rows={4}
                placeholder='{"task_name":"Follow up","due_days":3}'
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                defaultValue="{}"
              />
              <input type="hidden" name="step_order" value={String(steps.length + 1)} />
              <ActionButton
                type="submit"
                status={action.status}
                verb="create"
                labels={{ idle: "Add step", loading: "Adding…", success: "✓ Added" }}
              />
            </form>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
            Select a workflow to view and edit its steps.
          </div>
        )}

        <form
          className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void action.run(async () => {
              const r = await saveWorkflow(fd);
              assertActionResult(r);
              return r;
            });
          }}
        >
          <h4 className="text-sm font-semibold text-slate-900">Create School Workflow</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="school_id" required className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              name="workflow_key"
              placeholder="workflow_key"
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="name"
              placeholder="Workflow name"
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select name="trigger_event" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {Object.entries(TRIGGER_EVENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="category" value="general" />
          <input type="hidden" name="sort_order" value="100" />
          <ActionButton
            type="submit"
            status={action.status}
            verb="create"
            labels={{ idle: "Create workflow", loading: "Creating…", success: "✓ Created" }}
            errorMessage={action.errorMessage}
          />
        </form>
      </div>
    </div>
  );
}
