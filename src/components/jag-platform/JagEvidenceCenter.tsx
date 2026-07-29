"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { JagEvidenceUploadModal } from "@/components/jag-platform/JagEvidenceUploadModal";
import { JagEvidencePipelinePanel } from "@/components/jag-platform/JagEvidencePipelinePanel";
import { JagEvidenceKnowledgeGraph } from "@/components/jag-platform/JagEvidenceKnowledgeGraph";
import {
  CONFIDENTIALITY_LEVELS,
  CONNECTED_SYSTEM_PLACEHOLDERS,
  EVIDENCE_DOMAINS,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  KNOWLEDGE_LIBRARY_CATEGORIES,
  type CatalogDashboardSummary,
  type EvidenceDocument,
  type EvidenceProcessingJob,
  type EvidenceStatus,
  type KnowledgeGraphEdge,
  type KnowledgeGraphNode,
  type KnowledgeGraphSummary,
  type PipelineMetrics,
} from "@/lib/evidence-center";

type OrgOption = { readonly id: string; readonly name: string };

type Props = {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly documents: readonly EvidenceDocument[];
  readonly queue: Record<EvidenceStatus, number>;
  readonly dashboard: CatalogDashboardSummary;
  readonly businessUnits: readonly string[];
  readonly initialQuery?: string;
  readonly initialTab?: "catalog" | "pipeline" | "graph";
  readonly pipelineJobs: readonly EvidenceProcessingJob[];
  readonly pipelineMetrics: PipelineMetrics;
  readonly graphNodes: readonly KnowledgeGraphNode[];
  readonly graphEdges: readonly KnowledgeGraphEdge[];
  readonly graphSummary: KnowledgeGraphSummary;
};

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function statusLabel(status: EvidenceStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

function SummaryCard({
  title,
  entries,
}: {
  title: string;
  entries: Readonly<Record<string, number>>;
}) {
  const rows = Object.entries(entries).slice(0, 6);
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No data yet</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {rows.map(([label, count]) => (
            <li key={label} className="flex justify-between gap-2">
              <span className="truncate">{label}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function JagEvidenceCenter({
  organizations,
  organizationId,
  organizationName,
  documents,
  queue,
  dashboard,
  businessUnits,
  initialQuery = "",
  initialTab = "catalog",
  pipelineJobs,
  pipelineMetrics,
  graphNodes,
  graphEdges,
  graphSummary,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"catalog" | "pipeline" | "graph">(initialTab);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [domain, setDomain] = useState("");
  const [evidenceType, setEvidenceType] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [department, setDepartment] = useState("");
  const [confidentiality, setConfidentiality] = useState("");
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");

  const periodOptions = useMemo(
    () =>
      [...new Set(documents.map((d) => d.reportingPeriodLabel).filter(Boolean))],
    [documents]
  );
  const departmentOptions = useMemo(
    () => [...new Set(documents.map((d) => d.department).filter(Boolean))],
    [documents]
  );
  const ownerOptions = useMemo(
    () => [...new Set(documents.map((d) => d.owner).filter(Boolean))],
    [documents]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (domain && doc.domain !== domain) return false;
      if (evidenceType && doc.evidenceType !== evidenceType) return false;
      if (reportingPeriod && doc.reportingPeriodLabel !== reportingPeriod) {
        return false;
      }
      if (businessUnit && doc.businessUnit !== businessUnit) return false;
      if (department && doc.department !== department) return false;
      if (confidentiality && doc.confidentiality !== confidentiality) {
        return false;
      }
      if (owner && doc.owner !== owner) return false;
      if (source && doc.source !== source) return false;
      if (status && doc.status !== status) return false;
      if (!q) return true;
      const haystack = [
        doc.name,
        doc.domain,
        doc.evidenceType,
        doc.reportingPeriodLabel,
        doc.businessUnit,
        ...doc.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    documents,
    query,
    domain,
    evidenceType,
    reportingPeriod,
    businessUnit,
    department,
    confidentiality,
    owner,
    source,
    status,
  ]);

  const onOrgChange = (id: string) => {
    router.push(
      `/jag/evidence?org=${encodeURIComponent(id)}&tab=${tab}`
    );
  };

  const evidenceNames = Object.fromEntries(
    documents.map((doc) => [doc.id, doc.name])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Evidence Center™
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Evidence Catalog™ — understand what every artifact represents for
            The JAG™.
          </p>
        </div>
        {organizations.length > 1 ? (
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Organization</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={organizationId}
              onChange={(e) => onOrgChange(e.target.value)}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-slate-600">{organizationName}</p>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "catalog"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => setTab("catalog")}
        >
          Evidence Catalog™
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "pipeline"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => setTab("pipeline")}
        >
          Processing Pipeline™
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "graph"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => setTab("graph")}
        >
          Knowledge Graph™
        </button>
      </div>

      {tab === "pipeline" ? (
        <JagEvidencePipelinePanel
          organizationId={organizationId}
          jobs={pipelineJobs}
          metrics={pipelineMetrics}
          evidenceNames={evidenceNames}
        />
      ) : tab === "graph" ? (
        <JagEvidenceKnowledgeGraph
          organizationId={organizationId}
          nodes={graphNodes}
          edges={graphEdges}
          summary={graphSummary}
        />
      ) : (
        <>
      <Section title="Catalog Dashboard">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard title="Evidence by Domain" entries={dashboard.byDomain} />
          <SummaryCard title="Evidence by Type" entries={dashboard.byType} />
          <SummaryCard
            title="Evidence by Reporting Period"
            entries={dashboard.byReportingPeriod}
          />
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent Uploads
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {dashboard.recentUploads.length === 0 ? (
                <li className="text-slate-500">No uploads yet</li>
              ) : (
                dashboard.recentUploads.map((doc) => (
                  <li key={doc.id} className="truncate">
                    {doc.name}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Evidence Awaiting Review
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {dashboard.awaitingReview}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latest Versions
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {dashboard.latestVersionCount}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Connected Systems">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONNECTED_SYSTEM_PLACEHOLDERS.map((system) => (
            <li
              key={system.id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="font-medium text-slate-900">{system.name}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {system.connected ? "Connected" : "Not Connected"}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Evidence Catalog™"
        action={
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => setUploadOpen(true)}
          >
            Upload Evidence
          </button>
        }
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            placeholder="Search name, domain, type, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search evidence catalog"
          />
          <FilterSelect
            label="Domain"
            value={domain}
            onChange={setDomain}
            options={EVIDENCE_DOMAINS}
          />
          <FilterSelect
            label="Evidence Type"
            value={evidenceType}
            onChange={setEvidenceType}
            options={EVIDENCE_TYPES}
          />
          <FilterSelect
            label="Reporting Period"
            value={reportingPeriod}
            onChange={setReportingPeriod}
            options={periodOptions}
          />
          <FilterSelect
            label="Business Unit"
            value={businessUnit}
            onChange={setBusinessUnit}
            options={businessUnits}
          />
          <FilterSelect
            label="Department"
            value={department}
            onChange={setDepartment}
            options={departmentOptions}
          />
          <FilterSelect
            label="Confidentiality"
            value={confidentiality}
            onChange={setConfidentiality}
            options={CONFIDENTIALITY_LEVELS}
          />
          <FilterSelect
            label="Owner"
            value={owner}
            onChange={setOwner}
            options={ownerOptions}
          />
          <FilterSelect
            label="Source"
            value={source}
            onChange={setSource}
            options={EVIDENCE_SOURCES}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              "queued",
              "processing",
              "completed",
              "failed",
              "awaiting_review",
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-600">
            No evidence in the catalog yet. Upload your first record to begin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">Domain</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Period</th>
                  <th className="px-2 py-2 font-semibold">Unit</th>
                  <th className="px-2 py-2 font-semibold">Confidentiality</th>
                  <th className="px-2 py-2 font-semibold">Version</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-2 py-3">
                      <Link
                        href={`/jag/evidence/${doc.id}?org=${encodeURIComponent(organizationId)}`}
                        className="font-medium text-slate-900 underline-offset-2 hover:underline"
                      >
                        {doc.name}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{doc.domain}</td>
                    <td className="px-2 py-3 text-slate-600">
                      {doc.evidenceType}
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      {doc.reportingPeriodLabel}
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      {doc.businessUnit}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${confidentialityClass(doc.confidentiality)}`}
                      >
                        {doc.confidentiality}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      v{doc.currentVersion}
                    </td>
                    <td className="px-2 py-3 text-slate-700">
                      {statusLabel(doc.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Knowledge Library">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {KNOWLEDGE_LIBRARY_CATEGORIES.map((category) => (
            <li
              key={category}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
            >
              {category}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Processing Queue">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              "queued",
              "processing",
              "completed",
              "failed",
              "awaiting_review",
            ] as const
          ).map((item) => (
            <li
              key={item}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {statusLabel(item)}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {queue[item]}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <JagEvidenceUploadModal
        open={uploadOpen}
        organizationId={organizationId}
        organizationName={organizationName}
        businessUnits={businessUnits}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => router.refresh()}
      />
        </>
      )}
    </div>
  );
}

function FilterSelect({
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
    <label className="block text-xs">
      <span className="mb-1 block text-slate-500">{label}</span>
      <select
        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
