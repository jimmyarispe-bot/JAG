"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FIELD_LABELS,
  type FamilyGap,
} from "@/lib/people/completeness-shared";
import { sendMissingInfoRequests } from "@/lib/people/info-request-actions";

/**
 * Who is incomplete, and the button that asks them.
 *
 * Collapsed by default — this is a to-do list, not the point of the page. It
 * names every family and every field before anything is sent, because a button
 * that emails 40 households without showing you the list first is one misclick
 * from an apology.
 */
export function MissingInfoPanel({ gaps }: { gaps: FamilyGap[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ family: string; reason: string }[]>([]);

  if (!gaps.length) return null;

  const reachable = gaps.filter((g) => g.email);
  const unreachable = gaps.filter((g) => !g.email);
  const fieldCount = gaps.reduce(
    (t, g) => t + g.familyMissing.length + g.students.reduce((n, s) => n + s.missing.length, 0),
    0
  );

  async function send(familyIds?: string[]) {
    setBusy(true);
    setResult(null);
    setDetail([]);
    const response = await sendMissingInfoRequests({ familyIds });
    setBusy(false);
    if (!response.ok) {
      setResult(response.error);
      return;
    }
    const { sent, skipped, failed } = response.outcome;
    setResult(
      `${sent} email${sent === 1 ? "" : "s"} sent` +
        (skipped.length ? ` · ${skipped.length} skipped` : "") +
        (failed.length ? ` · ${failed.length} failed` : "")
    );
    setDetail([...failed, ...skipped]);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="text-sm text-amber-900">
          <strong>{gaps.length} famil{gaps.length === 1 ? "y is" : "ies are"} missing details</strong>
          {" — "}{fieldCount} field{fieldCount === 1 ? "" : "s"} a parent could fill in
        </span>
        <span className="shrink-0 text-xs text-amber-800 underline underline-offset-2">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-amber-200 px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => send()}
              disabled={busy || reachable.length === 0}
              className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {busy ? "Sending…" : `Email ${reachable.length} famil${reachable.length === 1 ? "y" : "ies"}`}
            </button>
            <span className="text-xs text-amber-900">
              Each parent gets a private link listing only their own missing fields.
              Reminders go weekly, four at most.
            </span>
          </div>

          {result && (
            <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-800">{result}</p>
          )}
          {detail.length > 0 && (
            <ul className="space-y-1 text-xs text-slate-600">
              {detail.map((d, i) => (
                <li key={i}><strong>{d.family}</strong> — {d.reason}</li>
              ))}
            </ul>
          )}

          {unreachable.length > 0 && (
            <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
              <strong>{unreachable.length}</strong> of these have no email address, so email
              cannot reach them: {unreachable.map((g) => g.familyName).join(", ")}. Those need
              a phone call.
            </p>
          )}

          <div className="max-h-64 overflow-y-auto rounded-xl bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {gaps.map((g) => (
                  <tr key={g.familyId} className="align-top">
                    <td className="w-48 px-3 py-2 font-medium text-slate-800">
                      {g.familyName}
                      {!g.email && <span className="block text-xs text-rose-700">no email</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {g.students.map((s) => (
                        <div key={s.id}>
                          {s.name}: {s.missing.map((m) => FIELD_LABELS[m]).join(", ")}
                        </div>
                      ))}
                      {g.familyMissing.length > 0 && (
                        <div>
                          Household: {g.familyMissing.map((m) => FIELD_LABELS[m]).join(", ")}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
