"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  RELATIONSHIP_TYPES,
  resolveEvidenceUploadFileSelection,
  type EvidenceDocument,
  type EvidenceRelationship,
  type EvidenceVersion,
} from "@/lib/evidence-center";

function confidentialityClass(level: string): string {
  switch (level) {
    case "Public":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "Internal":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "Confidential":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "Highly Confidential":
      return "bg-rose-50 text-rose-900 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export function JagEvidenceDetail({
  document,
  organizationId,
  versions,
  relationships,
  catalogOptions,
}: {
  readonly document: EvidenceDocument;
  readonly organizationId: string;
  readonly versions: readonly EvidenceVersion[];
  readonly relationships: readonly EvidenceRelationship[];
  readonly catalogOptions: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const [relType, setRelType] = useState<string>(RELATIONSHIP_TYPES[0]);
  const [relTarget, setRelTarget] = useState("");
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const nameById = Object.fromEntries(
    catalogOptions.map((item) => [item.id, item.name])
  );

  const addVersion = async () => {
    if (!versionFile) {
      setError("Select a file for the new version.");
      return;
    }
    setError("");
    setMessage("");
    try {
      const { runJagEvidenceSingleUpload } = await import(
        "@/lib/evidence-center/client-upload"
      );
      await runJagEvidenceSingleUpload({
        organizationId,
        organizationName: document.organizationName,
        file: versionFile,
        mode: "version",
        documentId: document.id,
      });
      setVersionFile(null);
      setMessage("Version uploaded and verified.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add version.");
    }
  };

  const addRelationship = async () => {
    if (!relTarget) {
      setError("Select related evidence.");
      return;
    }
    setError("");
    setMessage("");
    const response = await fetch("/api/jag-platform/evidence/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        fromDocumentId: document.id,
        toDocumentId: relTarget,
        relationshipType: relType,
      }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Could not create relationship.");
      return;
    }
    setRelTarget("");
    setMessage("Relationship saved.");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/jag/evidence?org=${encodeURIComponent(organizationId)}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← Evidence Catalog™
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          {document.name}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{document.fileName}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${confidentialityClass(document.confidentiality)}`}
          >
            {document.confidentiality}
          </span>
          {document.status === "completed" && (
            <a
              className="text-sm font-medium text-slate-900 underline"
              href={`/api/jag-platform/evidence/documents/${encodeURIComponent(document.id)}/download?organizationId=${encodeURIComponent(organizationId)}`}
            >
              Download
            </a>
          )}
        </div>
      </div>

      {(message || error) && (
        <p
          className={`text-sm ${error ? "text-red-600" : "text-emerald-700"}`}
          role="status"
        >
          {error || message}
        </p>
      )}

      <dl className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
        <Row label="Evidence Name" value={document.name} />
        <Row label="Organization" value={document.organizationName} />
        <Row label="Domain" value={document.domain} />
        <Row label="Evidence Type" value={document.evidenceType} />
        <Row
          label="Reporting Period"
          value={`${document.reportingPeriodKind}: ${document.reportingPeriodLabel}`}
        />
        <Row label="Business Unit" value={document.businessUnit || "—"} />
        <Row label="Department" value={document.department || "—"} />
        <Row label="Location" value={document.location || "—"} />
        <Row label="Owner" value={document.owner || "—"} />
        <Row label="Source" value={document.source} />
        <Row label="Version" value={`Version ${document.currentVersion} (latest)`} />
        <Row
          label="Status"
          value={document.status
            .split("_")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ")}
        />
        <Row label="Confidentiality" value={document.confidentiality} />
        <Row
          label="Tags"
          value={document.tags.length ? document.tags.join(", ") : "—"}
        />
        <Row label="Description" value={document.description || "—"} />
        <Row
          label="Upload Date"
          value={new Date(document.createdAt).toLocaleString()}
        />
        <Row
          label="Last Modified"
          value={new Date(document.updatedAt).toLocaleString()}
        />
      </dl>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Version History
        </h3>
        <ul className="mt-4 space-y-2 text-sm">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900">
                  Version {version.versionNumber}
                  {version.isLatest ? " · Latest" : ""}
                  {version.superseded ? " · Superseded" : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {version.fileName} ·{" "}
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Add version</span>
            <input
              type="file"
              onChange={(e) => {
                const resolved = resolveEvidenceUploadFileSelection({
                  previousFile: versionFile,
                  evidenceName: "",
                  pickedFiles: e.target.files,
                });
                if (resolved.kind === "selected") {
                  setVersionFile(resolved.file);
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            onClick={addVersion}
          >
            Upload Version
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Relationships
        </h3>
        <ul className="mt-4 space-y-2 text-sm">
          {relationships.length === 0 ? (
            <li className="text-slate-500">No relationships yet.</li>
          ) : (
            relationships.map((rel) => {
              const otherId =
                rel.fromDocumentId === document.id
                  ? rel.toDocumentId
                  : rel.fromDocumentId;
              const direction =
                rel.fromDocumentId === document.id ? "→" : "←";
              return (
                <li
                  key={rel.id}
                  className="rounded-lg border border-slate-100 px-3 py-2"
                >
                  <span className="font-medium text-slate-900">
                    {rel.relationshipType}
                  </span>{" "}
                  {direction}{" "}
                  <Link
                    href={`/jag/evidence/${otherId}?org=${encodeURIComponent(organizationId)}`}
                    className="underline"
                  >
                    {nameById[otherId] ?? otherId}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={relType}
            onChange={(e) => setRelType(e.target.value)}
          >
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            value={relTarget}
            onChange={(e) => setRelTarget(e.target.value)}
          >
            <option value="">Select evidence…</option>
            {catalogOptions
              .filter((item) => item.id !== document.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 sm:col-span-3"
            onClick={addRelationship}
          >
            Add Relationship
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Evidence Timeline
        </h3>
        <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4">
          {[...document.timeline]
            .slice()
            .reverse()
            .map((event) => (
              <li key={event.id} className="text-sm">
                <p className="font-medium text-slate-900">{event.label}</p>
                <p className="text-xs text-slate-500">
                  {new Date(event.at).toLocaleString()}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                </p>
              </li>
            ))}
        </ol>
      </section>

      <section className="space-y-3">
        <ComingSoon title="AI Summary" />
        <ComingSoon title="Extracted Insights" />
        <ComingSoon title="Referenced By Executive Intelligence" />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">Coming Soon</p>
    </div>
  );
}
