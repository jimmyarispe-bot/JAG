"use client";

import { useState } from "react";
import { addLeadTask, completeTask } from "@/lib/admissions/actions";
import type { AdmissionTask } from "@/lib/admissions/queries";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface TasksPanelProps {
  leadId: string;
  tasks: AdmissionTask[];
}

export function TasksPanel({ leadId, tasks }: TasksPanelProps) {
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const action = useActionFeedback({
    verb: "create",
    successToast: "✓ Updated",
    errorToast: "Unable to update task.",
    progressLabel: "Updating task…",
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) return;
    const name = taskName.trim();
    const due = dueDate || null;
    void action.run(async () => {
      const result = await addLeadTask(leadId, name, due);
      assertActionResult(result);
      setTaskName("");
      setDueDate("");
      return result;
    });
  }

  function handleComplete(taskId: string) {
    void action.run(async () => {
      const result = await completeTask(taskId, leadId);
      assertActionResult(result);
      return result;
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Tasks</h3>
      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
        <input
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Task name"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm min-w-[160px]"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Add", loading: "Creating…", success: "✓ Created" }}
          disabled={!taskName.trim()}
          className="!rounded-lg !px-3 !py-2 !text-xs"
        />
      </form>
      <ul className="mt-4 space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center justify-between rounded-xl px-3 py-2 ${
              task.task_status === "completed" ? "bg-emerald-50" : "bg-slate-50"
            }`}
          >
            <div>
              <p className={`text-sm ${task.task_status === "completed" ? "text-slate-500 line-through" : "text-slate-900"}`}>
                {task.task_name}
              </p>
              {task.due_date && (
                <p className="text-xs text-slate-400">Due {task.due_date}</p>
              )}
            </div>
            {task.task_status === "open" && (
              <ActionButton
                type="button"
                status={action.status}
                verb="save"
                variant="success"
                labels={{ idle: "Complete", loading: "Completing…", success: "✓ Done" }}
                onClick={() => handleComplete(task.id)}
              />
            )}
          </li>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-slate-400">No tasks yet.</p>
        )}
      </ul>
    </div>
  );
}
