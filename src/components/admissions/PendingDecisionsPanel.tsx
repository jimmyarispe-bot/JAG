"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { answerDecisionGate } from "@/lib/admissions/gates/actions";
import { GATES, type PendingGate } from "@/lib/admissions/gates/definitions";

/**
 * One card per waiting decision.
 *
 * Everything needed to answer is on the card — what the family said about their
 * child, which school, which stage — because a decision made after clicking
 * through three screens is a decision made on less information than this one
 * deserves.
 *
 * Each button states its consequence underneath. Nobody should learn what "No"
 * did by seeing the email afterwards.
 */
export function PendingDecisionsPanel({ initial }: { initial: PendingGate[] }) {
  const [gates, setGates] = useState<PendingGate[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
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
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setGates((prev) => prev.filter((g) => g.id !== gate.id));
    });
  }

  if (gates.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-8 text-center text-sm text-slate-500">
        Nothing is waiting on you.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {error}
        </div>
      ) : null}

      {gates.map((gate) => {
        const definition = GATES[gate.gateKey];
        const busy = pending && busyId === gate.id;

        return (
          <section key={gate.id} className="rounded-2xl border border-slate-100 bg-white">
            <header className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{gate.studentName}</h2>
                <p className="text-sm text-slate-500">
                  {[gate.schoolName, gate.grade].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="mt-2 text-base font-medium text-academy">{definition.question}</p>
              <p className="mt-1 text-sm text-slate-500">{definition.reviewHint}</p>
            </header>

            <div className="space-y-3 px-5 py-4 text-sm">
              {gate.greatness ? (
                <div>
                  <p className="font-medium text-slate-700">Their child&rsquo;s greatness</p>
                  <p className="text-slate-600">{gate.greatness}</p>
                </div>
              ) : null}
              {gate.challenges ? (
                <div>
                  <p className="font-medium text-slate-700">Challenges they described</p>
                  <p className="text-slate-600">{gate.challenges}</p>
                </div>
              ) : null}
              <p className="text-slate-500">
                {gate.guardianName ?? "Guardian"}
                {gate.guardianEmail ? ` · ${gate.guardianEmail}` : ""}
              </p>
              <Link
                href={`/dashboard/admissions/leads/${gate.leadId}`}
                className="inline-block font-medium text-academy hover:underline"
              >
                Open the full record →
              </Link>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Note (optional, kept on the record)
                </span>
                <textarea
                  rows={2}
                  value={notes[gate.id] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [gate.id]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {definition.branches.map((branch) => (
                  <div key={branch.answer}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => answer(gate, branch.answer)}
                      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
                        branch.answer === "yes" || branch.answer === "accept"
                          ? "bg-academy text-white hover:bg-academy-dark"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {busy ? "Working…" : branch.label}
                    </button>
                    {/* The consequence, before the click, not after. */}
                    <p className="mt-1 text-xs text-slate-500">{branch.consequence}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
