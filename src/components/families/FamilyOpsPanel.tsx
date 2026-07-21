"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/experience-system/feedback";
import { mergeFamiliesAction, splitFamilyAction } from "@/lib/families/lifecycle/actions";

interface FamilyOpsPanelProps {
  familyId: string;
  familyName: string;
  students: Array<{ id: string; first_name: string; last_name: string }>;
  otherFamilies: Array<{ id: string; family_name: string }>;
  canManage: boolean;
}

export function FamilyOpsPanel({
  familyId,
  familyName,
  students,
  otherFamilies,
  canManage,
}: FamilyOpsPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [targetFamilyId, setTargetFamilyId] = useState(otherFamilies[0]?.id ?? "");
  const [splitName, setSplitName] = useState(`${familyName} (new)`);
  const [selected, setSelected] = useState<string[]>([]);

  if (!canManage) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Household operations</h3>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase text-slate-500">Merge into another family</p>
        <select
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          value={targetFamilyId}
          onChange={(e) => setTargetFamilyId(e.target.value)}
        >
          <option value="">Select target family…</option>
          {otherFamilies.map((f) => (
            <option key={f.id} value={f.id}>
              {f.family_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !targetFamilyId}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          onClick={() =>
            startTransition(async () => {
              if (!window.confirm("Merge this family into the selected family? History is preserved.")) {
                return;
              }
              const result = await mergeFamiliesAction({
                sourceFamilyId: familyId,
                targetFamilyId,
              });
              if (!result.ok) {
                toast.error("Unable to merge.", result.error);
                return;
              }
              toast.success("Families merged.");
              router.push(`/dashboard/families/${result.targetFamilyId}?section=overview`);
              router.refresh();
            })
          }
        >
          Merge Family
        </button>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase text-slate-500">Split selected students</p>
        <input
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          value={splitName}
          onChange={(e) => setSplitName(e.target.value)}
          placeholder="New household name"
        />
        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
          {students.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <li key={s.id}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelected((prev) =>
                        checked ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      )
                    }
                  />
                  {s.first_name} {s.last_name}
                </label>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          disabled={pending || selected.length === 0 || !splitName.trim()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() =>
            startTransition(async () => {
              const result = await splitFamilyAction({
                sourceFamilyId: familyId,
                studentIds: selected,
                newFamilyName: splitName,
              });
              if (!result.ok) {
                toast.error("Unable to split.", result.error);
                return;
              }
              toast.success("Family split.");
              router.push(`/dashboard/families/${result.newFamilyId}?section=overview`);
              router.refresh();
            })
          }
        >
          Split Family
        </button>
      </div>
    </div>
  );
}
