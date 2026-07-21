"use client";

import { useRef } from "react";
import {
  ActionButton,
  OperationProgress,
  useActionFeedback,
} from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import { runImportAction, startMigrationAction } from "@/lib/enterprise-data/actions";
import { IMPORT_TYPES } from "@/lib/enterprise-data/types";

export function DataImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const validateAction = useActionFeedback({
    verb: "run",
    labels: { idle: "Validate & stage", loading: "Validating…", success: "✓ Staged" },
    successToast: "✓ Import validated and staged.",
    errorToast: "Unable to validate import.",
    progressLabel: "Validating import…",
  });
  const commitAction = useActionFeedback({
    verb: "import",
    labels: { idle: "Commit import", loading: "Importing…", success: "✓ Imported" },
    successToast: "✓ Import committed.",
    errorToast: "Unable to commit import.",
    progressLabel: "Committing import…",
  });

  function submit(form: HTMLFormElement, commit: boolean) {
    const runner = commit ? commitAction : validateAction;
    void runner.run(async () => {
      const fd = new FormData(form);
      if (commit) fd.set("commit", "true");
      const result = await runImportAction(fd);
      assertActionResult(result);
      return result ?? { success: true };
    });
  }

  return (
    <>
      <form
        ref={formRef}
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget, false);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Import type
            <select name="import_type" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
              {IMPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Format
            <select name="source_format" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="zip">ZIP</option>
              <option value="quickbooks">QuickBooks</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">
          CSV content (paste for demo)
          <textarea
            name="file_content"
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            placeholder="first_name,last_name,email,school_id&#10;Jane,Doe,jane@example.com,"
          />
        </label>
        <input type="hidden" name="file_name" value="import.csv" />
        <div className="flex flex-wrap gap-3">
          <ActionButton
            type="submit"
            status={validateAction.status}
            verb="run"
            labels={{ idle: "Validate & stage", loading: "Validating…", success: "✓ Staged" }}
            errorMessage={validateAction.errorMessage}
            onRetry={() => {
              if (formRef.current) submit(formRef.current, false);
            }}
          />
          <ActionButton
            type="button"
            status={commitAction.status}
            verb="import"
            variant="secondary"
            labels={{ idle: "Commit import", loading: "Importing…", processing: "Processing…", success: "✓ Imported" }}
            errorMessage={commitAction.errorMessage}
            onRetry={() => {
              if (formRef.current) submit(formRef.current, true);
            }}
            onClick={() => {
              if (formRef.current) submit(formRef.current, true);
            }}
          />
        </div>
        {(validateAction.isBusy || commitAction.isBusy) && (
          <OperationProgress
            className="mt-3"
            label={
              commitAction.isBusy
                ? commitAction.status === "processing"
                  ? "Processing import…"
                  : "Importing students…"
                : "Validating import…"
            }
            value={commitAction.progressValue ?? validateAction.progressValue ?? undefined}
            detail={
              commitAction.isBusy
                ? "Large imports continue in the background — you can keep working."
                : undefined
            }
          />
        )}
      </form>

      <ExperienceForm
        action={startMigrationAction}
        verb="create"
        labels={{ idle: "Start new migration session" }}
        progressLabel="Starting migration session…"
        className="mt-4"
        buttonVariant="primary"
        buttonSize="sm"
      />
    </>
  );
}
