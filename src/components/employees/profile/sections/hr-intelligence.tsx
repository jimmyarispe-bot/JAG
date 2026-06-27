import { ProfilePlaceholderPanel } from "@/components/platform/profile-sections/ProfilePlaceholderPanel";
import { ProfileRecordTable } from "@/components/platform/profile-sections/ProfileRecordTable";
import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";
import { formatLabel, missingSection } from "@/components/employees/profile/sections/shared";
import { formatCurrency } from "@/lib/format";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";

export function PayrollSection(props: ProfileSectionViewProps) {
  const data = props.data as { records: Record<string, unknown>[] } | null;
  if (!data) return missingSection("Payroll");

  return (
    <ProfileCard title="Payroll History">
      {data.records.length === 0 ? (
        <ProfileEmpty>No payroll records on file</ProfileEmpty>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.records.map((record) => (
            <li key={String(record.id)} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span>
                {String(record.pay_period_start ?? "—")} – {String(record.pay_period_end ?? "—")}
              </span>
              <span>
                {formatCurrency(Number(record.gross_pay ?? 0))} · {formatLabel(record.pay_status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}

export function PtoSection(props: ProfileSectionViewProps) {
  const data = props.data as { requests: Record<string, unknown>[] } | null;
  if (!data) return missingSection("PTO");

  return (
    <ProfileRecordTable
      title="Leave Requests"
      records={data.requests}
      emptyMessage="No leave requests on file"
      columns={[
        { key: "leave_type", label: "Type", render: (row) => formatLabel(row.leave_type) },
        { key: "start_date", label: "Start" },
        { key: "end_date", label: "End" },
        { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
      ]}
    />
  );
}

export function PerformanceReviewsSection(props: ProfileSectionViewProps) {
  const data = props.data as { evaluations: Record<string, unknown>[] } | null;
  if (!data) return missingSection("Performance Reviews");

  return (
    <ProfileRecordTable
      title="Performance Evaluations"
      records={data.evaluations}
      emptyMessage="No performance evaluations on file"
      columns={[
        { key: "evaluation_period", label: "Period" },
        { key: "rating", label: "Rating", render: (row) => formatLabel(row.rating) },
        { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
        { key: "created_at", label: "Created", render: (row) => formatLabel(row.created_at) },
      ]}
    />
  );
}

export function CertificationsSection(props: ProfileSectionViewProps) {
  const data = props.data as { certifications: Record<string, unknown>[] } | null;
  if (!data) return missingSection("Certifications");

  return (
    <ProfileRecordTable
      title="Certifications"
      records={data.certifications}
      emptyMessage="No certifications on file"
      columns={[
        { key: "certification_name", label: "Name" },
        {
          key: "certification_type",
          label: "Type",
          render: (row) => formatLabel(row.certification_type),
        },
        { key: "expiration_date", label: "Expires" },
        { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
      ]}
    />
  );
}

export function LicensesSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    licenses: Record<string, unknown>[];
    allCertifications: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Licenses", "partial");

  const records = data.licenses.length ? data.licenses : data.allCertifications;

  return (
    <ProfileRecordTable
      title="Licenses"
      records={records}
      emptyMessage="No licenses on file"
      columns={[
        { key: "certification_name", label: "License" },
        { key: "expiration_date", label: "Expires" },
        { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
      ]}
    />
  );
}

export function ProfessionalDevelopmentSection(props: ProfileSectionViewProps) {
  const data = props.data as { training: Record<string, unknown>[] } | null;
  if (!data) return missingSection("Professional Development");

  return (
    <ProfileRecordTable
      title="Training Records"
      records={data.training}
      emptyMessage="No professional development records on file"
      columns={[
        { key: "training_name", label: "Training", render: (row) => formatLabel(row.training_name ?? row.title ?? row.course_name) },
        { key: "provider", label: "Provider" },
        { key: "completed_at", label: "Completed" },
        { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
      ]}
    />
  );
}

export function AiInsightsSection(props: ProfileSectionViewProps) {
  const data = props.data as { message?: string } | null;
  return (
    <ProfilePlaceholderPanel
      title="AI Insights"
      message={data?.message ?? "Workforce intelligence recommendations will appear here."}
    />
  );
}
