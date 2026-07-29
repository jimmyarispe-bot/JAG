"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignDecisionCenterOwner } from "@/lib/jag-command-center/decision-center/actions";
import type {
  JagDecisionAssignment,
  JagDecisionAssignmentTarget,
  JagDecisionPriorityLabel,
} from "@/lib/jag-command-center/decision-center/types";
import { JAG_PLATFORM_ROLES } from "@/lib/jag-platform/roles";

export function JagDecisionAssignmentForm({
  decisionId,
  organizationId,
  organizationName,
  assignment,
}: {
  readonly decisionId: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly assignment: JagDecisionAssignment | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [targetType, setTargetType] =
    useState<JagDecisionAssignmentTarget>(
      assignment?.targetType ?? "organization"
    );
  const [role, setRole] = useState(assignment?.role ?? "ORG_OWNER");
  const [userLabel, setUserLabel] = useState(assignment?.userLabel ?? "");
  const [dueDate, setDueDate] = useState(
    assignment?.dueDate ? assignment.dueDate.slice(0, 10) : ""
  );
  const [priority, setPriority] = useState<JagDecisionPriorityLabel>(
    assignment?.priority ?? "P2"
  );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await assignDecisionCenterOwner({
            decisionId,
            targetType,
            organizationId:
              targetType === "organization" ? organizationId : undefined,
            organizationName:
              targetType === "organization" ? organizationName : undefined,
            role: targetType === "role" ? role : undefined,
            userLabel: targetType === "user" ? userLabel : undefined,
            userId: targetType === "user" ? userLabel : undefined,
            dueDate: dueDate || undefined,
            priority,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      {assignment ? (
        <p className="text-xs text-[var(--jag-muted)]">
          Current: {assignment.summary}
          {assignment.dueDate
            ? ` · due ${assignment.dueDate.slice(0, 10)}`
            : ""}
          {" · "}
          {assignment.priority}
        </p>
      ) : (
        <p className="text-xs text-[var(--jag-muted)]">
          Assign after approval to move the decision into the operational queue.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Assign to">
          <select
            value={targetType}
            onChange={(e) =>
              setTargetType(e.target.value as JagDecisionAssignmentTarget)
            }
            className={selectClass}
          >
            <option value="organization">Organization</option>
            <option value="role">Role</option>
            <option value="user">Specific user</option>
          </select>
        </Field>

        {targetType === "organization" ? (
          <Field label="Organization">
            <input
              readOnly
              value={organizationName}
              className={inputClass}
            />
          </Field>
        ) : null}

        {targetType === "role" ? (
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectClass}
            >
              {JAG_PLATFORM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {targetType === "user" ? (
          <Field label="User">
            <input
              value={userLabel}
              onChange={(e) => setUserLabel(e.target.value)}
              placeholder="Name or email"
              className={inputClass}
              required
            />
          </Field>
        ) : null}

        <Field label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Priority">
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as JagDecisionPriorityLabel)
            }
            className={selectClass}
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </Field>
      </div>

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : assignment ? "Update assignment" : "Assign"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)]";
const selectClass = inputClass;
const buttonClass =
  "rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-3 py-1.5 text-xs text-[var(--jag-text)] disabled:opacity-50";
