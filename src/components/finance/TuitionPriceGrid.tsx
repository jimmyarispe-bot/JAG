"use client";

import { useState, useTransition } from "react";
import { setTuitionPrice } from "@/lib/finance/tuition-catalog-actions";
import type {
  TuitionSchoolGroup,
  TuitionPriceRow,
} from "@/lib/finance/tuition-catalog-shared";

/**
 * The price grid, one school at a time.
 *
 * Two things this screen refuses to blur:
 *
 *   - Blank is not zero. A blank price means the system may not bill for this
 *     item yet, and it says so rather than showing "$0.00".
 *   - A row the family does not pay for says who owes it instead. FL students
 *     take Virtual classes; that money is owed school to school, and the row
 *     should never read like something a parent will be charged.
 */

function money(n: number | null): string {
  if (n === null) return "";
  return n.toFixed(2);
}

function Amount({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-slate-400">not set</span>;
  }
  return <span className="tabular-nums">${value.toFixed(2)}</span>;
}

function Row({ row }: { row: TuitionPriceRow }) {
  const [editing, setEditing] = useState(false);
  const [standard, setStandard] = useState(money(row.standardAmount));
  const [oneToOne, setOneToOne] = useState(money(row.oneToOneAmount));
  const [saved, setSaved] = useState<{ standard: number | null; oneToOne: number | null }>({
    standard: row.standardAmount,
    oneToOne: row.oneToOneAmount,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    const formData = new FormData();
    formData.set("price_id", row.priceId);
    formData.set("standard_amount", standard);
    formData.set("one_to_one_amount", oneToOne);

    startTransition(async () => {
      const result = await setTuitionPrice(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "ok" in result) {
        // Read back what the server actually stored, not what was typed. If it
        // parsed "1,200" to 1200 or an empty box to null, the row must show
        // that rather than the string still sitting in the input.
        setSaved({
          standard: result.standardAmount ?? null,
          oneToOne: result.oneToOneAmount ?? null,
        });
        setEditing(false);
      }
    });
  }

  function cancel() {
    setStandard(money(saved.standard));
    setOneToOne(money(saved.oneToOne));
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
            <input
              inputMode="decimal"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              placeholder="blank = not set"
              className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm tabular-nums"
            />
          </td>
          <td className="px-4 py-3">
            <input
              inputMode="decimal"
              value={oneToOne}
              onChange={(e) => setOneToOne(e.target.value)}
              placeholder="blank = not offered"
              className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm tabular-nums"
            />
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
            <Amount value={saved.standard} />
          </td>
          <td className="px-4 py-3 text-sm">
            {saved.oneToOne === null ? (
              <span className="text-slate-400">not offered</span>
            ) : (
              <Amount value={saved.oneToOne} />
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
                    Standard
                    <span className="ml-1 normal-case text-slate-400">(program or a la carte)</span>
                  </th>
                  <th className="px-4 py-2 font-medium">
                    1:1<span className="ml-1 normal-case text-slate-400">(tutoring)</span>
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
        </section>
      ))}
    </div>
  );
}
