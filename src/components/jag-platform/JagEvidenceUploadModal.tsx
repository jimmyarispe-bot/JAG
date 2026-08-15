"use client";

import { useCallback, useRef, useState } from "react";
import {
  ALLOWED_EVIDENCE_EXTENSIONS,
  CONFIDENTIALITY_LEVELS,
  DEFAULT_BUSINESS_UNITS,
  EVIDENCE_DOMAINS,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  REPORTING_PERIOD_KINDS,
} from "@/lib/evidence-center";
import {
  MAX_BULK_EVIDENCE_FILES,
} from "@/lib/evidence-center/bulk-constants";
import {
  resolveEvidenceUploadBatchSelection,
  summarizeEvidenceQueue,
  clearEvidenceUploadModalBatchState,
  type EvidenceUploadQueueItem,
} from "@/lib/evidence-center/bulk-queue";
import { runJagEvidenceBulkUpload } from "@/lib/evidence-center/bulk-upload";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900";

type Props = {
  readonly open: boolean;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly businessUnits?: readonly string[];
  readonly onClose: () => void;
  readonly onUploaded: () => void;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function statusLabel(item: EvidenceUploadQueueItem): string {
  if (item.validationStatus === "invalid") return "Invalid";
  switch (item.uploadStatus) {
    case "pending":
      return "Ready";
    case "uploading":
      return "Uploading…";
    case "success":
      return "AVAILABLE";
    case "failed":
      return "FAILED";
    case "skipped":
      return "Skipped";
    default:
      return item.uploadStatus;
  }
}

export function JagEvidenceUploadModal({
  open,
  organizationId,
  organizationName,
  businessUnits = DEFAULT_BUSINESS_UNITS,
  onClose,
  onUploaded,
}: Props) {
  const [queue, setQueue] = useState<EvidenceUploadQueueItem[]>([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState<string>(EVIDENCE_DOMAINS[0]);
  const [evidenceType, setEvidenceType] = useState<string>(EVIDENCE_TYPES[0]);
  const [reportingPeriodKind, setReportingPeriodKind] = useState<string>("Annual");
  const [reportingPeriodLabel, setReportingPeriodLabel] = useState("FY2025");
  const [businessUnit, setBusinessUnit] = useState<string>(
    businessUnits[0] ?? "Corporate"
  );
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState<string>("Uploaded");
  const [confidentiality, setConfidentiality] = useState<string>("Internal");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchSummary, setBatchSummary] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<EvidenceUploadQueueItem[]>([]);
  const nameRef = useRef("");
  queueRef.current = queue;
  nameRef.current = name;

  const accept = ALLOWED_EVIDENCE_EXTENSIONS.map((e) => `.${e}`).join(",");
  const summary = summarizeEvidenceQueue(queue);
  const isSingle = queue.length === 1;
  const hasFailed = summary.failed > 0;
  const uploadComplete =
    queue.length > 0 &&
    summary.uploading === 0 &&
    summary.pending === 0 &&
    (summary.success > 0 || summary.failed > 0);

  const applyPickedFiles = useCallback(
    (pickedFiles: ArrayLike<File> | null | undefined) => {
      const resolved = resolveEvidenceUploadBatchSelection({
        previousItems: queueRef.current,
        evidenceName: nameRef.current,
        pickedFiles,
      });
      if (resolved.kind === "unchanged") {
        return;
      }
      queueRef.current = [...resolved.items];
      nameRef.current = resolved.evidenceName;
      setQueue([...resolved.items]);
      setName(resolved.evidenceName);
      setError("");
      setBatchSummary("");
      if (resolved.overflowCount > 0) {
        setError(
          `${resolved.overflowCount} file(s) exceed the ${MAX_BULK_EVIDENCE_FILES}-file batch limit and will not be uploaded.`
        );
      }
      setFileInputKey((key) => key + 1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      applyPickedFiles(event.dataTransfer.files);
    },
    [applyPickedFiles]
  );

  const handleModalCancel = useCallback(() => {
    if (loading) return;
    const cleared = clearEvidenceUploadModalBatchState({
      queue,
      evidenceName: name,
      error,
      batchSummary,
      loading,
      dragOver,
      fileInputKey,
    });
    queueRef.current = [];
    nameRef.current = "";
    setQueue([...cleared.queue]);
    setName(cleared.evidenceName);
    setError(cleared.error);
    setBatchSummary(cleared.batchSummary);
    setLoading(cleared.loading);
    setDragOver(cleared.dragOver);
    setFileInputKey(cleared.fileInputKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  }, [
    loading,
    queue,
    name,
    error,
    batchSummary,
    dragOver,
    fileInputKey,
    onClose,
  ]);

  if (!open) return null;

  const sharedMetadata = {
    domain,
    evidenceType,
    description,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    reportingPeriodKind,
    reportingPeriodLabel,
    businessUnit,
    department,
    location,
    owner,
    source,
    confidentiality,
  };

  const runUpload = async (mode: "all-valid-pending" | "failed-only") => {
    if (queue.length === 0) {
      setError("Select one or more files to upload.");
      return;
    }
    const eligible = queue.filter(
      (i) =>
        i.validationStatus === "valid" &&
        (mode === "failed-only"
          ? i.uploadStatus === "failed"
          : i.uploadStatus === "pending" || i.uploadStatus === "failed")
    );
    if (eligible.length === 0) {
      setError(
        mode === "failed-only"
          ? "No failed files to retry."
          : "No valid files ready to upload."
      );
      return;
    }

    // Single-file: apply Evidence Name override into documentName before upload.
    let itemsForUpload = queue;
    if (isSingle && queue[0]) {
      const only = queue[0];
      const documentName =
        name.trim() || only.documentName || only.file.name.replace(/\.[^.]+$/, "");
      itemsForUpload = [{ ...only, documentName }];
      setQueue(itemsForUpload);
      queueRef.current = itemsForUpload;
    }

    setLoading(true);
    setError("");
    setBatchSummary("");
    try {
      const next = await runJagEvidenceBulkUpload({
        organizationId,
        organizationName,
        items: itemsForUpload,
        sharedMetadata,
        mode,
        onItemUpdate: (item) => {
          setQueue((prev) => {
            const mapped = prev.map((row) =>
              row.clientId === item.clientId ? item : row
            );
            queueRef.current = mapped;
            return mapped;
          });
        },
      });
      setQueue(next);
      queueRef.current = next;
      const done = summarizeEvidenceQueue(next);
      setBatchSummary(
        `${done.success} of ${done.valid} valid file(s) uploaded successfully.` +
          (done.failed > 0 ? ` ${done.failed} failed.` : "")
      );
      if (done.success > 0) {
        onUploaded();
      }
      if (done.failed === 0 && done.success > 0 && done.invalid === 0) {
        setName("");
        setDescription("");
        setTags("");
        setQueue([]);
        queueRef.current = [];
        setFileInputKey((key) => key + 1);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-upload-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2
          id="evidence-upload-title"
          className="text-lg font-semibold text-slate-900"
        >
          Upload Evidence
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload documents for {organizationName}. Files are stored privately
          and verified before they become available.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {MAX_BULK_EVIDENCE_FILES} files maximum. Each file must be 20 MiB or
          smaller.
        </p>

        <div
          className={`mt-5 rounded-lg border border-dashed px-4 py-8 text-center text-sm ${
            dragOver
              ? "border-slate-900 bg-slate-50"
              : "border-slate-300 bg-slate-50/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p className="font-medium text-slate-800">
            {queue.length === 0
              ? "Drag & drop files here"
              : `${queue.length} file${queue.length === 1 ? "" : "s"} selected`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, DOCX, XLSX, CSV, PPTX, TXT
          </p>
          <label className="mt-4 inline-flex cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
            Browse
            <input
              key={fileInputKey}
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple
              className="hidden"
              data-testid="evidence-file-input"
              disabled={loading}
              onChange={(e) => {
                applyPickedFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {queue.length > 0 ? (
          <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            <ul className="divide-y divide-slate-100" data-testid="evidence-upload-queue">
              {queue.map((item) => (
                <li key={item.clientId} className="px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-medium text-slate-900"
                        data-testid="evidence-queue-filename"
                      >
                        {item.displayName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(item.byteSize)}
                        {item.mimeType ? ` · ${item.mimeType}` : ""}
                        {!isSingle ? ` · name: ${item.documentName}` : ""}
                      </p>
                      {item.validationError ? (
                        <p className="mt-1 text-xs text-red-600">
                          {item.validationError}
                        </p>
                      ) : null}
                      {item.error ? (
                        <p className="mt-1 text-xs text-red-600">{item.error}</p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.uploadStatus === "success"
                          ? "bg-emerald-50 text-emerald-800"
                          : item.uploadStatus === "failed" ||
                              item.validationStatus === "invalid"
                            ? "bg-rose-50 text-rose-800"
                            : item.uploadStatus === "uploading"
                              ? "bg-sky-50 text-sky-800"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {statusLabel(item)}
                      {item.uploadStatus === "uploading" && item.progress != null
                        ? ` ${item.progress}%`
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-3 text-sm text-slate-600" data-testid="evidence-upload-progress">
            Uploading… {summary.success + summary.failed} of{" "}
            {summary.valid} valid file(s) finished ({summary.uploading} in
            flight).
          </p>
        ) : null}

        {batchSummary ? (
          <p className="mt-3 text-sm text-slate-700" role="status">
            {batchSummary}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {isSingle || queue.length === 0 ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">
                Evidence Name
              </span>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="FY2025 Profit & Loss"
                disabled={loading}
              />
            </label>
          ) : (
            <p className="sm:col-span-2 text-xs text-slate-500">
              Multiple files selected — each document name defaults to its
              filename (without extension). Shared metadata below applies to
              every file in the batch.
            </p>
          )}
          <Select
            label="Domain"
            value={domain}
            onChange={setDomain}
            options={EVIDENCE_DOMAINS}
            disabled={loading}
          />
          <Select
            label="Evidence Type"
            value={evidenceType}
            onChange={setEvidenceType}
            options={EVIDENCE_TYPES}
            disabled={loading}
          />
          <Select
            label="Reporting Period Kind"
            value={reportingPeriodKind}
            onChange={setReportingPeriodKind}
            options={REPORTING_PERIOD_KINDS}
            disabled={loading}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Reporting Period
            </span>
            <input
              className={inputClass}
              value={reportingPeriodLabel}
              onChange={(e) => setReportingPeriodLabel(e.target.value)}
              placeholder="FY2025 / Q2 2026 / January 2026"
              disabled={loading}
            />
          </label>
          <Select
            label="Business Unit"
            value={businessUnit}
            onChange={setBusinessUnit}
            options={businessUnits}
            disabled={loading}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Department
            </span>
            <input
              className={inputClass}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Location
            </span>
            <input
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Owner</span>
            <input
              className={inputClass}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="CFO"
              disabled={loading}
            />
          </label>
          <Select
            label="Source"
            value={source}
            onChange={setSource}
            options={EVIDENCE_SOURCES}
            disabled={loading}
          />
          <Select
            label="Confidentiality"
            value={confidentiality}
            onChange={setConfidentiality}
            options={CONFIDENTIALITY_LEVELS}
            disabled={loading}
          />
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Description
            </span>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Tags (comma-separated)
            </span>
            <input
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="fy2025, official, board"
              disabled={loading}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            onClick={handleModalCancel}
            disabled={loading}
            data-testid="evidence-upload-modal-cancel"
          >
            {uploadComplete ? "Close" : "Cancel"}
          </button>
          {hasFailed && !loading ? (
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              onClick={() => void runUpload("failed-only")}
            >
              Retry failed
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={() => void runUpload("all-valid-pending")}
            disabled={loading || summary.valid === 0}
          >
            {loading
              ? "Uploading…"
              : queue.length > 1
                ? `Upload ${summary.valid} file${summary.valid === 1 ? "" : "s"}`
                : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
