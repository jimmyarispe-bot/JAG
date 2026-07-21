"use client";

import { useRouter } from "next/navigation";
import { createStudent } from "@/lib/students/actions";
import { createFamilyWithGuardians } from "@/lib/families/actions";
import { resolveStudentCreateUiState } from "@/lib/students/create-result";
import { GRADES } from "@/lib/constants/grades";
import {
  PROGRAMS,
  STUDENTS_PROGRAM_CODES,
  assertCanonicalProgramForWrite,
} from "@/lib/constants/programs";
import { FundingSourceCheckboxes } from "@/components/ui/FundingSourceCheckboxes";
import { EnrollmentFamilyFields } from "@/components/students/EnrollmentFamilyFields";
import { ActionButton, ErrorBanner, useActionFeedback } from "@/components/experience-system/feedback";

interface StudentFormProps {
  schools: { id: string; name: string }[];
  families: { id: string; family_name: string; billing_email?: string | null }[];
  schoolYears: { id: string; name: string; school_id: string }[];
  canManageFamily?: boolean;
}

/** Client-side gate — invalid program never reaches createStudent / Postgres. */
export function validateStudentFormProgram(formData: FormData): string | null {
  const gate = assertCanonicalProgramForWrite(String(formData.get("program") ?? ""));
  return gate.ok ? null : gate.error;
}

export function StudentForm({
  schools,
  families,
  canManageFamily = true,
}: StudentFormProps) {
  const router = useRouter();
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Create Student" },
    successToast: "✓ Created",
    errorToast: "Unable to create.",
    progressLabel: "Creating student…",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    console.log("[TEMP_STUDENT_CREATE_AUDIT]", {
      stage: "StudentForm.submit",
      rawProgram: formData.get("program"),
      allEntries: Object.fromEntries(formData.entries()),
    });

    const programError = validateStudentFormProgram(formData);
    if (programError) {
      void action.run(async () => {
        throw new Error(programError);
      });
      return;
    }

    void action.run(async () => {
      const createFamily = formData.get("create_family") === "true";
      const familyMode = String(formData.get("family_mode") ?? "");

      // New family: create student first, then atomically create family+guardians+link.
      if (createFamily && familyMode === "new") {
        formData.delete("family_id");
        const studentResult = await createStudent(formData);
        const studentUi = resolveStudentCreateUiState(studentResult);
        if (studentUi.status === "error") {
          throw new Error(studentUi.errorMessage);
        }

        const familyData = new FormData(form);
        familyData.set("student_id", studentUi.studentId);
        familyData.set(
          "student_last_name",
          String(formData.get("last_name") ?? "")
        );
        const familyResult = await createFamilyWithGuardians(familyData);
        if ("error" in familyResult) {
          // Student exists — profile empty-state CTAs can finish family linking.
          throw new Error(
            `${familyResult.error} Student was created; open the profile to finish linking a family.`
          );
        }

        router.push(`/dashboard/students/${studentUi.studentId}?section=family`);
        return { id: studentUi.studentId };
      }

      // Existing family or no family selected.
      if (familyMode !== "existing") {
        formData.delete("family_id");
      }

      const result = await createStudent(formData);
      const ui = resolveStudentCreateUiState(result);
      if (ui.status === "error") {
        throw new Error(ui.errorMessage);
      }
      router.push(`/dashboard/students/${ui.studentId}`);
      return { id: ui.studentId };
    });
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6"
    >
      {action.errorMessage && (
        <ErrorBanner message={action.errorMessage} title="Could not create student" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="first_name">
            First Name *
          </label>
          <input id="first_name" name="first_name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="last_name">
            Last Name *
          </label>
          <input id="last_name" name="last_name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="school_id">
            School *
          </label>
          <select
            id="school_id"
            name="school_id"
            required
            className={inputClass}
            defaultValue=""
          >
            <option value="" disabled>
              Select school
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="program">
            Program
          </label>
          <select
            id="program"
            name="program"
            className={inputClass}
            defaultValue=""
            // Only canonical DB codes are options — see STUDENTS_PROGRAM_CODES.
            data-canonical-programs={STUDENTS_PROGRAM_CODES.join(",")}
          >
            <option value="">Select program</option>
            {PROGRAMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="grade_level">
            Grade Level
          </label>
          <select id="grade_level" name="grade_level" className={inputClass} defaultValue="">
            <option value="">Select grade</option>
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="date_of_birth">
            Date of Birth
          </label>
          <input id="date_of_birth" name="date_of_birth" type="date" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="enrollment_status">
            Enrollment Status
          </label>
          <select
            id="enrollment_status"
            name="enrollment_status"
            className={inputClass}
            defaultValue="pending"
          >
            <option value="pending">Pending</option>
            <option value="enrolled">Enrolled</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>

        <EnrollmentFamilyFields families={families} canManage={canManageFamily} />

        <div className="sm:col-span-2">
          <FundingSourceCheckboxes />
        </div>
      </div>

      <ActionButton
        type="submit"
        status={action.status}
        verb="create"
        labels={{ idle: "Create Student" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
