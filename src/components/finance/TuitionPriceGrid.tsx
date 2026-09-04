"use client";

import { useState, useTransition } from "react";
import { setTuitionPrice } from "@/lib/finance/tuition-catalog-actions";
import {
  periodLabel,
  type TuitionSchoolGroup,
  type TuitionPriceRow,
} from "@/lib/finance/tuition-catalog-shared";

/**
 * The price grid, one school at a time.
 *
 * Three things this screen refuses to blur:
 *
 *   - Blank is not zero. A blank price means the system may not bill for this
 *     item yet, and it says so rather than showing "$0.00".
 *   - Every amount states its period. "$850" and "$850 / month" are different
 *     claims, and a field that makes neither is how a school-year figure ends
 *     up billed twelve times.
 *   - "Not offered" and "not priced" are different facts. The 1:1 column used
 *     to render one blank as both.
 */

function money(n: number | null): string {
  if (n === null) return "";
  return n.toFixed(2);
}

function Blank({ children }: { children: string }) {
  return <span className="text-slate-400">{children}</span>;
}

interface SavedState {
  standard: number | null;
  offeredOneToOne: boolean;
  sessionRate: number | null;
}

function Row({ row }: { row: TuitionPriceRow }) {
  const [editing, setEditing] = useState(false);
  const [standard, setStandard] = useState(money(row.standardAmount));
  const [sessionRate, setSessionRate] = useState(money(row.oneToOneSessionRate));
  const [offered, setOffered] = useState(row.offeredOneToOne);
  const [saved, setSaved] = useState<SavedState>({
    standard: row.standardAmount,
    offeredOneToOne: row.offeredOneToOne,
    sessionRate: row.oneToOneSessionRate,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const period = periodLabel(row.billingFrequency);

  function save() {
    setError(null);
    const formData = new FormData();
    formData.set("price_id", row.priceId);
    formData.set("standard_amount", standard);
    formData.set("one_to_one_session_rate", sessionRate);
    formData.set("offered_one_to_one", offered ? "true" : "false");

    startTransition(async () => {
      const result = await setTuitionPrice(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "ok" in result) {
        // Read back what the server actually stored, not what was typed. If it
        // parsed "1,200" to 1200, or dropped a rate because the item is not
        // sold 1:1, the row must show that rather than the string still sitting
        // in the input.
        setSaved({
          standard: result.standardAmount ?? null,
          offeredOneToOne: result.offeredOneToOne ?? false,
          sessionRate: result.oneToOneSessionRate ?? null,
        });
        setSessionRate(money(result.oneToOneSessionRate ?? null));
        setEditing(false);
      }
    });
  }

  function cancel() {
    setStandard(money(saved.standard));
    setSessionRate(money(saved.sessionRate));
    setOffered(saved.offeredOneToOne);
    setError(null);
    setEditing(false);
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{row.itemName}</p>
        <p className="text-xs text-slate-500">
          {row.itemKind === "package" ? "Package" : "Class"}
          {row.description ? ` · ${row.description}` : ""}
        </p>
        {!row.billedToFamily ? (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Owed to {row.providerSchoolName} · not billed to the family
          </p>
        ) : null}
      </td>

      {editing ? (
        <>
          <td className="px-4 py-3">
            <div className="flex items-baseline gap-1">
              <input
                inputMode="decimal"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="blank = not set"
                className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm tabular-nums"
              />
              <span className="text-xs text-slate-500">/ {period}</span>
            </div>
          </td>
          <td className="px-4 py-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={offered}
                onChange={(e) => setOffered(e.target.checked)}
              />
              Sold 1:1
            </label>
            {offered ? (
              <div className="mt-1 flex items-baseline gap-1">
                <input
                  inputMode="decimal"
                  value={sessionRate}
                  onChange={(e) => setSessionRate(e.target.value)}
                  placeholder="per session"
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm tabular-nums"
                />
                <span className="text-xs text-slate-500">/ session</span>
              </div>
            ) : null}
          </td>
          <td className="px-4 py-3 text-right">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="rounded-lg bg-academy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="ml-2 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            {error ? <p className="mt-1 text-xs text-amber-700">{error}</p> : null}
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-sm">
            {saved.standard === null ? (
              <Blank>not set</Blank>
            ) : (
              <>
                <span className="tabular-nums">${saved.standard.toFixed(2)}</span>
                <span className="ml-1 text-xs text-slate-500">/ {period}</span>
              </>
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {!saved.offeredOneToOne ? (
              <Blank>not offered</Blank>
            ) : saved.sessionRate === null ? (
              <Blank>not set</Blank>
            ) : (
              <>
                <span className="tabular-nums">${saved.sessionRate.toFixed(2)}</span>
                <span className="ml-1 text-xs text-slate-500">/ session</span>
              </>
            )}
          </td>
          <td className="px-4 py-3 text-right">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-academy hover:underline"
            >
              Edit
            </button>
            {error ? <p className="mt-1 text-xs text-amber-700">{error}</p> : null}
          </td>
        </>
      )}
    </tr>
  );
}

export function TuitionPriceGrid({ groups }: { groups: TuitionSchoolGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-8 text-center text-sm text-slate-500">
        No tuition items are set up yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.schoolId} className="rounded-2xl border border-slate-100 bg-white">
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{group.schoolName}</h2>
            {group.unpriced > 0 ? (
              <p className="text-sm text-amber-700">
                {group.unpriced} of {group.rows.length} not priced — nothing can be billed for these
              </p>
            ) : (
              <p className="text-sm text-slate-500">All {group.rows.length} priced</p>
            )}
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">
                    Tuition
                    <span className="ml-1 normal-case text-slate-400">(program or a la carte)</span>
                  </th>
                  <th className="px-4 py-2 font-medium">
                    1:1 tutoring
                    <span className="ml-1 normal-case text-slate-400">(rate per session)</span>
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <Row key={row.priceId} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            A 1:1 month is sessions requested × the rate per session. The session count belongs to
            the family&rsquo;s plan, not to the price.
          </p>
        </section>
      ))}
    </div>
  );
}
