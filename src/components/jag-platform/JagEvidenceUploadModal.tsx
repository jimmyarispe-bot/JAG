"use client";

import { useCallback, useState } from "react";
import {
  ALLOWED_EVIDENCE_EXTENSIONS,
  CONFIDENTIALITY_LEVELS,
  DEFAULT_BUSINESS_UNITS,
  EVIDENCE_DOMAINS,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  REPORTING_PERIOD_KINDS,
} from "@/lib/evidence-center";

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

export function JagEvidenceUploadModal({
  open,
  organizationId,
  organizationName,
  businessUnits = DEFAULT_BUSINESS_UNITS,
  onClose,
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
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
  const [dragOver, setDragOver] = useState(false);

  const accept = ALLOWED_EVIDENCE_EXTENSIONS.map((e) => `.${e}`).join(",");

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const next = event.dataTransfer.files?.[0];
    if (next) {
      setFile(next);
      if (!name) setName(next.name.replace(/\.[^.]+$/, ""));
    }
  }, [name]);

  if (!open) return null;

  const submit = async () => {
    if (!file) {
      setError("Select a file to upload.");
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/jag-platform/evidence/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        organizationName,
        fileName: file.name,
        mimeType: file.type,
        byteSize: file.size,
        name: name || file.name.replace(/\.[^.]+$/, ""),
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
      }),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };
    setLoading(false);
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }
    setFile(null);
    setName("");
    setDescription("");
    setTags("");
    onUploaded();
    onClose();
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
          Catalog evidence for {organizationName}. Metadata only — no AI
          processing.
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
            {file ? file.name : "Drag & drop a file here"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, DOCX, XLSX, CSV, PPTX, TXT
          </p>
          <label className="mt-4 inline-flex cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
            Browse
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                if (next && !name) setName(next.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Evidence Name
            </span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FY2025 Profit & Loss"
            />
          </label>
          <Select
            label="Domain"
            value={domain}
            onChange={setDomain}
            options={EVIDENCE_DOMAINS}
          />
          <Select
            label="Evidence Type"
            value={evidenceType}
            onChange={setEvidenceType}
            options={EVIDENCE_TYPES}
          />
          <Select
            label="Reporting Period Kind"
            value={reportingPeriodKind}
            onChange={setReportingPeriodKind}
            options={REPORTING_PERIOD_KINDS}
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
            />
          </label>
          <Select
            label="Business Unit"
            value={businessUnit}
            onChange={setBusinessUnit}
            options={businessUnits}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Department
            </span>
            <input
              className={inputClass}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
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
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Owner</span>
            <input
              className={inputClass}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="CFO"
            />
          </label>
          <Select
            label="Source"
            value={source}
            onChange={setSource}
            options={EVIDENCE_SOURCES}
          />
          <Select
            label="Confidentiality"
            value={confidentiality}
            onChange={setConfidentiality}
            options={CONFIDENTIALITY_LEVELS}
          />
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Description
            </span>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Uploading…" : "Upload"}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
