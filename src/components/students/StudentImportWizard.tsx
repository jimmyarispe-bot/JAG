"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  commitStudentImport,
  configureStudentImportDestination,
  downloadStudentImportErrorReport,
  downloadStudentImportReport,
  downloadStudentImportTemplate,
  mapStudentImportColumns,
  previewStudentImport,
  rollbackStudentImport,
  uploadStudentImportFile,
  validateStudentImport,
} from "@/lib/platform/imports/actions";
import type {
  FieldMapping,
  ImportJob,
  ImportMode,
  ImportTemplate,
  PreviewRow,
  WizardStepKey,
} from "@/lib/platform/imports/types";
import { WIZARD_STEPS } from "@/lib/platform/imports/types";

type School = { id: string; name: string };
type Campus = { id: string; name: string; school_id: string };
type SchoolYear = { id: string; name: string; school_id: string; is_current: boolean | null };
type Program = { value: string; label: string };

interface Props {
  schools: School[];
  campuses: Campus[];
  schoolYears: SchoolYear[];
  programs: Program[];
  history: ImportJob[];
  templates: ImportTemplate[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadText(fileName: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const IMPORT_MODES: Array<{ value: ImportMode; label: string; hint: string }> = [
  { value: "create_only", label: "Create only", hint: "Skip rows that match existing students" },
  { value: "update_existing", label: "Update existing", hint: "Update matches; create new rows" },
  { value: "skip_duplicates", label: "Skip duplicates", hint: "Leave existing students unchanged" },
  { value: "merge_duplicates", label: "Merge duplicates", hint: "Fill blank fields on matches" },
  { value: "ask_during_preview", label: "Ask during preview", hint: "Flag duplicates for review" },
];

export function StudentImportWizard({
  schools,
  campuses,
  schoolYears,
  programs,
  history: initialHistory,
  templates,
}: Props) {
  const [step, setStep] = useState<WizardStepKey>("upload");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    fileName: string;
    fileSizeBytes: number;
    rowCount: number;
    headers: string[];
  } | null>(null);

  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [campusId, setCampusId] = useState("");
  const [program, setProgram] = useState(programs[0]?.value ?? "");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("create_only");

  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [fields, setFields] = useState<Array<{ key: string; label: string; required?: boolean }>>([]);
  const [validation, setValidation] = useState<{
    valid: number;
    warnings: number;
    errors: number;
    familyGroups: number;
    scholarshipMatches: number;
    scholarshipUnknown: number;
    errorReportCsv: string;
  } | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<Record<string, number> | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [results, setResults] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    warnings: number;
    durationMs: number;
    reportCsv: string;
  } | null>(null);
  const [history, setHistory] = useState(initialHistory);

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);

  const filteredCampuses = useMemo(
    () => campuses.filter((c) => c.school_id === schoolId),
    [campuses, schoolId]
  );
  const filteredYears = useMemo(
    () => schoolYears.filter((y) => y.school_id === schoolId),
    [schoolYears, schoolId]
  );

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    });
  }

  function onFileSelected(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    run(async () => {
      const result = await uploadStudentImportFile(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJobId(result.jobId);
      setFileMeta({
        fileName: result.fileName,
        fileSizeBytes: result.fileSizeBytes,
        rowCount: result.rowCount,
        headers: result.headers,
      });
      setStep("destination");
    });
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((s, idx) => {
          const active = s.key === step;
          const done = idx < stepIndex;
          return (
            <li
              key={s.key}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                active
                  ? "bg-brand-600 text-white"
                  : done
                    ? "bg-brand-50 text-brand-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {s.number}. {s.label}
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {step === "upload" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Upload roster</h2>
          <p className="mt-1 text-sm text-slate-500">
            CSV, Excel (.xlsx / .xls), or Google Sheets export.
          </p>

          <div
            className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFileSelected(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-base font-medium text-slate-800">Drag & drop your file here</p>
            <p className="mt-1 text-sm text-slate-500">or click to browse</p>
            <p className="mt-4 text-xs text-slate-400">Supported: .csv, .xlsx, .xls</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
            />
          </div>

          {fileMeta && (
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-500">Filename</dt><dd className="font-medium">{fileMeta.fileName}</dd></div>
              <div><dt className="text-slate-500">Size</dt><dd className="font-medium">{formatBytes(fileMeta.fileSizeBytes)}</dd></div>
              <div><dt className="text-slate-500">Rows detected</dt><dd className="font-medium">{fileMeta.rowCount}</dd></div>
            </dl>
          )}

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-800">Download templates</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() =>
                      run(async () => {
                        const file = await downloadStudentImportTemplate(t.id);
                        if (!file.ok) {
                          setError(file.error);
                          return;
                        }
                        downloadText(file.fileName, file.csv);
                      })
                    }
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {step === "destination" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Choose destination</h2>
          {fileMeta && (
            <p className="text-sm text-slate-500">
              {fileMeta.fileName} · {fileMeta.rowCount} rows · {formatBytes(fileMeta.fileSizeBytes)}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">School</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={schoolId}
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  setCampusId("");
                  setSchoolYearId("");
                }}
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Campus</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
              >
                <option value="">— Optional —</option>
                {filteredCampuses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Program</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                {programs.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">School Year</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={schoolYearId}
                onChange={(e) => setSchoolYearId(e.target.value)}
              >
                <option value="">— Optional —</option>
                {filteredYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}{y.is_current ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Import mode</legend>
            <div className="mt-2 grid gap-2">
              {IMPORT_MODES.map((mode) => (
                <label key={mode.value} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === mode.value}
                    onChange={() => setImportMode(mode.value)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{mode.label}</span>
                    <span className="block text-xs text-slate-500">{mode.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-2 pt-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep("upload")}>
              Back
            </button>
            <button
              type="button"
              disabled={pending || !jobId || !schoolId || !program}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const result = await configureStudentImportDestination({
                    jobId: jobId!,
                    schoolId,
                    campusId: campusId || null,
                    program,
                    schoolYearId: schoolYearId || null,
                    importMode,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  const mapped = await mapStudentImportColumns({ jobId: jobId! });
                  if (!mapped.ok) {
                    setError(mapped.error);
                    return;
                  }
                  setMappings(mapped.mappings);
                  setFields(mapped.fields);
                  setStep("mapping");
                })
              }
            >
              Continue to mapping
            </button>
          </div>
        </section>
      )}

      {step === "mapping" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Column mapping</h2>
          <p className="text-sm text-slate-500">
            Columns were auto-matched. Remap any field before validation.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">Target field</th>
                  <th className="py-2">Source column</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const current = mappings.find((m) => m.targetField === field.key);
                  return (
                    <tr key={field.key} className="border-b border-slate-100">
                      <td className="py-2 pr-4">
                        {field.label}
                        {field.required ? <span className="text-rose-600"> *</span> : null}
                      </td>
                      <td className="py-2">
                        <select
                          className="w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5"
                          value={current?.sourceField ?? ""}
                          onChange={(e) => {
                            const sourceField = e.target.value;
                            setMappings((prev) => {
                              const others = prev.filter((m) => m.targetField !== field.key);
                              return [
                                ...others,
                                {
                                  sourceField,
                                  targetField: field.key,
                                  required: field.required,
                                  confidence: sourceField ? 1 : 0,
                                },
                              ];
                            });
                          }}
                        >
                          <option value="">— Not mapped —</option>
                          {(fileMeta?.headers ?? []).map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep("destination")}>
              Back
            </button>
            <button
              type="button"
              disabled={pending || !jobId}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  await mapStudentImportColumns({ jobId: jobId!, mappings });
                  const result = await validateStudentImport({ jobId: jobId!, mappings });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setValidation({
                    valid: result.valid,
                    warnings: result.warnings,
                    errors: result.errors,
                    familyGroups: result.familyGroups,
                    scholarshipMatches: result.scholarshipMatches,
                    scholarshipUnknown: result.scholarshipUnknown,
                    errorReportCsv: result.errorReportCsv,
                  });
                  setStep("validation");
                })
              }
            >
              Validate
            </button>
          </div>
        </section>
      )}

      {step === "validation" && validation && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Validation</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <div className="text-2xl font-semibold text-emerald-800">{validation.valid}</div>
              <div className="text-sm text-emerald-700">Valid</div>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3">
              <div className="text-2xl font-semibold text-amber-800">{validation.warnings}</div>
              <div className="text-sm text-amber-700">Warnings</div>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3">
              <div className="text-2xl font-semibold text-rose-800">{validation.errors}</div>
              <div className="text-sm text-rose-700">Errors</div>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Family groups detected: {validation.familyGroups}. Scholarship matches:{" "}
            {validation.scholarshipMatches}. Unknown scholarships: {validation.scholarshipUnknown}.
          </p>
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() =>
              downloadText(`import-errors-${jobId?.slice(0, 8)}.csv`, validation.errorReportCsv)
            }
          >
            Download Error Report
          </button>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep("mapping")}>
              Back
            </button>
            <button
              type="button"
              disabled={pending || !jobId}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const result = await previewStudentImport({ jobId: jobId! });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setPreviewRows(result.preview.rows);
                  setPreviewSummary(result.preview.summary as unknown as Record<string, number>);
                  setStep("preview");
                })
              }
            >
              Preview import
            </button>
          </div>
        </section>
      )}

      {step === "preview" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Preview</h2>
          {previewSummary && (
            <p className="text-sm text-slate-600">
              {previewSummary.total} rows · {previewRows.filter((r) => r.highlight === "new").length} new ·{" "}
              {previewRows.filter((r) => r.highlight === "updated").length} updates ·{" "}
              {previewRows.filter((r) => r.highlight === "duplicate" || r.highlight === "skipped").length} skipped/duplicate
            </p>
          )}
          <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Parent</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 200).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={
                      row.highlight === "new"
                        ? "bg-emerald-50/70"
                        : row.highlight === "updated"
                          ? "bg-sky-50/70"
                          : row.highlight === "duplicate"
                            ? "bg-amber-50/70"
                            : row.highlight === "skipped"
                              ? "bg-slate-50"
                              : row.highlight === "error"
                                ? "bg-rose-50/70"
                                : ""
                    }
                  >
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">
                      {String(row.mapped.first_name ?? "")} {String(row.mapped.last_name ?? "")}
                    </td>
                    <td className="px-3 py-2">{String(row.mapped.parent_email ?? row.mapped.parent_name ?? "—")}</td>
                    <td className="px-3 py-2 capitalize">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep("validation")}>
              Back
            </button>
            <button
              type="button"
              disabled={pending || !jobId}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() => {
                setStep("import");
                setImportProgress(8);
                run(async () => {
                  const tick = window.setInterval(() => {
                    setImportProgress((p) => Math.min(p + 7, 90));
                  }, 400);
                  const result = await commitStudentImport({ jobId: jobId! });
                  window.clearInterval(tick);
                  setImportProgress(100);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setResults({
                    imported: result.imported,
                    updated: result.updated,
                    skipped: result.skipped,
                    failed: result.failed,
                    warnings: result.warnings,
                    durationMs: result.durationMs,
                    reportCsv: result.reportCsv,
                  });
                  setStep("results");
                });
              }}
            >
              Start import
            </button>
          </div>
        </section>
      )}

      {step === "import" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Importing…</h2>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-sm text-slate-600">
            Status: {pending ? "Import in progress" : "Finishing"} · Estimated remaining:{" "}
            {importProgress >= 90 ? "almost done" : "calculating…"}
          </p>
        </section>
      )}

      {step === "results" && results && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Import results</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Imported", results.imported],
              ["Updated", results.updated],
              ["Skipped", results.skipped],
              ["Failed", results.failed],
              ["Warnings", results.warnings],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-2xl font-semibold text-slate-900">{value}</div>
                <div className="text-sm text-slate-600">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Duration: {(results.durationMs / 1000).toFixed(1)}s
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={() => downloadText(`import-report-${jobId?.slice(0, 8)}.csv`, results.reportCsv)}
            >
              Download Import Report
            </button>
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={() =>
                run(async () => {
                  const report = await downloadStudentImportErrorReport(jobId!);
                  if (!report.ok) {
                    setError(report.error);
                    return;
                  }
                  downloadText(report.fileName, report.csv);
                })
              }
            >
              Download Error Report
            </button>
            <a
              href="/dashboard/students"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
            >
              View students
            </a>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Import history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">File</th>
                <th className="py-2 pr-3">Rows</th>
                <th className="py-2 pr-3">Imported</th>
                <th className="py-2 pr-3">Updated</th>
                <th className="py-2 pr-3">Failed</th>
                <th className="py-2 pr-3">Skipped</th>
                <th className="py-2 pr-3">Duration</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500">
                    No imports yet.
                  </td>
                </tr>
              )}
              {history.map((job) => (
                <tr key={job.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(job.startedAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">{job.importedByName ?? "—"}</td>
                  <td className="py-2 pr-3">{job.fileName}</td>
                  <td className="py-2 pr-3">{job.counts.total}</td>
                  <td className="py-2 pr-3">{job.counts.imported}</td>
                  <td className="py-2 pr-3">{job.counts.updated}</td>
                  <td className="py-2 pr-3">{job.counts.failed}</td>
                  <td className="py-2 pr-3">{job.counts.skipped}</td>
                  <td className="py-2 pr-3">
                    {job.durationMs != null ? `${(job.durationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-brand-700 hover:underline"
                        onClick={() =>
                          run(async () => {
                            const report = await downloadStudentImportReport(job.id);
                            if (!report.ok) {
                              setError(report.error);
                              return;
                            }
                            downloadText(report.fileName, report.csv);
                          })
                        }
                      >
                        Report
                      </button>
                      {(job.status === "completed" || job.status === "failed") && (
                        <button
                          type="button"
                          className="text-rose-700 hover:underline"
                          onClick={() =>
                            run(async () => {
                              if (!window.confirm("Roll back this entire import?")) return;
                              const result = await rollbackStudentImport({ jobId: job.id });
                              if (!result.ok) {
                                setError(result.error);
                                return;
                              }
                              if (result.errors.length) {
                                setError(result.errors.join("; "));
                              }
                              setHistory((prev) =>
                                prev.map((h) =>
                                  h.id === job.id ? { ...h, status: "rolled_back" } : h
                                )
                              );
                            })
                          }
                        >
                          Rollback
                        </button>
                      )}
                      {job.status === "rolled_back" && (
                        <span className="text-slate-400">Rolled back</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
