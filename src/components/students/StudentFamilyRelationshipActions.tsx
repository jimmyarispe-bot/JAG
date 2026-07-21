"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/experience-system/feedback";
import { moveStudentToFamilyAction } from "@/lib/families/lifecycle/actions";
import { createFamilyWithGuardians } from "@/lib/families/actions";

interface FamilyOption {
  id: string;
  family_name: string;
}

interface StudentFamilyRelationshipActionsProps {
  studentId: string;
  studentLastName: string;
  schoolId: string;
  currentFamilyId: string | null;
  families: FamilyOption[];
  canManage: boolean;
}

export function StudentFamilyRelationshipActions({
  studentId,
  studentLastName,
  schoolId,
  currentFamilyId,
  families,
  canManage,
}: StudentFamilyRelationshipActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [assignId, setAssignId] = useState("");

  if (!canManage) return null;

  const options = families.filter((f) => f.id !== currentFamilyId);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">Family relationships</p>

      <div className="flex flex-wrap gap-2">
        <select
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          value={assignId}
          onChange={(e) => setAssignId(e.target.value)}
        >
          <option value="">Assign existing family…</option>
          {options.map((f) => (
            <option key={f.id} value={f.id}>
              {f.family_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !assignId}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          onClick={() =>
            startTransition(async () => {
              const result = await moveStudentToFamilyAction({
                studentId,
                familyId: assignId,
              });
              if (!result.ok) {
                toast.error("Unable to move student.", result.error);
                return;
              }
              toast.success(currentFamilyId ? "Student moved." : "Family assigned.");
              router.refresh();
            })
          }
        >
          {currentFamilyId ? "Move Student" : "Assign Family"}
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        onClick={() =>
          startTransition(async () => {
            const formData = new FormData();
            formData.set("school_id", schoolId);
            formData.set("student_id", studentId);
            formData.set("student_last_name", studentLastName);
            formData.set("family_name", `${studentLastName} Family`);
            formData.set("primary_first_name", "Primary");
            formData.set("primary_last_name", studentLastName || "Guardian");
            const result = await createFamilyWithGuardians(formData);
            if ("error" in result) {
              toast.error("Unable to create family.", result.error);
              return;
            }
            toast.success("New family created.");
            router.push(`/dashboard/families/${result.familyId}?section=parents-guardians`);
            router.refresh();
          })
        }
      >
        Create New Family
      </button>

      {currentFamilyId && (
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={`/dashboard/families/${currentFamilyId}?section=overview`}
            className="text-brand-600 hover:text-brand-700"
          >
            Open current family
          </a>
          <a
            href={`/dashboard/families/${currentFamilyId}?section=students`}
            className="text-slate-600 hover:text-brand-600"
          >
            Merge / Split (family ops)
          </a>
        </div>
      )}
    </div>
  );
}
