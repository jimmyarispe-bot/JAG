"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { answerDecisionGate } from "@/lib/admissions/gates/actions";
import { GATES, type PendingGate } from "@/lib/admissions/gates/definitions";
import { buildAdmissionsCaseHref } from "@/lib/admissions/profile/href";
import { gradeLabel } from "@/lib/constants/grades";
import { daysInCurrentStage, pipelineAgingClasses } from "@/lib/admissions/workflow";

/**
 * The Decision column, sitting immediately after Shadow Days Completed.
 *
 * Jimmy, 24 September 2026: "after the shadow days completed, then the decision
 * needs to be made." This is that column.
 *
 * IT IS NOT A STAGE, and deliberately so. A family here is still at
 * `shadow_day_completed`; what has changed is that a question is open on them.
 * Inventing a `decision` lead stage would mean somebody had to move the card
 * into it, and a stage nobody can enter without being told to is a stage that
 * lies about where a child actually is. The column is drawn from the open
 * accept-or-deny gates instead, so it fills and empties by itself.
 *
 * The wording comes from GATES, the same object the Decisions page and the
 * server action read. The question a school leader sees and the consequence of
 * their answer cannot drift apart, and nothing here restates either in its own
 * words.
 */
export function BoardDecisionColumn({ gates }: { gates: readonly PendingGate[] }) {
  const definition = GATES.accept_or_deny;
  const [open, setOpen] = useState<PendingGate[]>([...gates]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function answer(gate: PendingGate, value: string) {
    setError(null);
    setBusyId(gate.id);
    const formData = new FormData();
    formData.set("gate_id", gate.id);
    formData.set("answer", value);
    formData.set("answer_notes", notes[gate.id] ?? "");

    startTransition(async () => {
      const result = await answerDecisionGate(formData);
      setBusyId(null);
      /*
       * A returned { error } is not a thrown error. Without this the card
       * disappeared on a failure and the school leader believed a family had
       * been accepted who had not been.
       */
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen((prev) => prev.filter((g) => g.id !== gate.id));
    });
  }

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-2xl border border-amber-200 bg-amber-50/60">
      <div className="border-b border-amber-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            Decision
          </span>
          <span className="text-xs font-medium text-amber-700">{open.length}</span>
        </div>
        <p className="mt-1 text-xs text-amber-800">{definition.question}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {error ? (
          <div className="rounded-lg bg-white px-3 py-2 text-xs text-amber-900" role="alert">
            {error}
          </div>
        ) : null}

        {open.map((gate) => {
          const busy = pending && busyId === gate.id;
          const waiting = daysInCurrentStage(gate.createdAt);
          return (
            <div
              key={gate.id}
              className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm"
            >
              <Link
                href={buildAdmissionsCaseHref(gate.leadId)}
                className="font-medium text-slate-900 hover:text-brand-600"
              >
                {gate.studentName}
              </Link>
              <span
                className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${pipelineAgingClasses(waiting)}`}
                title={`${waiting} days waiting on an answer`}
              >
                {waiting}d
              </span>
              <p className="mt-1 text-xs text-slate-500">
                {gate.schoolName ?? "—"}
                {gate.grade ? ` · ${gradeLabel(gate.grade)}` : ""}
              </p>

              <label className="mt-2 block text-xs text-slate-500">
                Note (optional, kept on the record)
                <textarea
                  value={notes[gate.id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [gate.id]: e.target.value }))
                  }
                  rows={2}
                  disabled={busy}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
                />
              </label>

              {definition.branches.map((branch) => (
                <div key={branch.answer} className="mt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => answer(gate, branch.answer)}
                    aria-busy={busy || undefined}
                    className={
                      branch.answer === "accept"
                        ? "w-full rounded-lg bg-brand-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                        : "w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                    }
                  >
                    {busy ? "Working…" : branch.label}
                  </button>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    {branch.consequence}
                  </p>
                </div>
              ))}
            </div>
          );
        })}

        {open.length === 0 && (
          <p className="py-4 text-center text-xs text-amber-700">Nothing waiting on you</p>
        )}
      </div>
    </div>
  );
}
