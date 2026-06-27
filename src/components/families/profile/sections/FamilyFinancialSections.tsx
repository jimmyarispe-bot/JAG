import { ProfileRecordTable } from "@/components/platform/profile-sections/ProfileRecordTable";
import { ProfileStatGrid } from "@/components/platform/profile-sections/ProfileStatGrid";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { FamilyFinancialCenter } from "@/components/finance/FamilyFinancialCenter";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { isFamilyProfileEnvelope } from "@/lib/families/profile/types";
import {
  formatCurrency,
  formatLabel,
  missingSection,
  nestedName,
} from "@/components/families/profile/sections/shared";

export function FinancialResponsibilitySection(props: ProfileSectionViewProps) {
  const data = props.data as {
    payers: Record<string, unknown>[];
    guardians: Record<string, unknown>[];
    account: Record<string, unknown> | null;
  } | null;
  if (!data) return missingSection("Financial Responsibility");

  const billingContacts = data.guardians.filter((g) => g.receives_billing);

  return (
    <div className="space-y-6">
      {data.account && (
        <ProfileStatGrid
          items={[
            { label: "Account balance", value: formatCurrency(Number(data.account.balance ?? 0)) },
            {
              label: "Credit balance",
              value: formatCurrency(Number(data.account.credit_balance ?? 0)),
            },
            { label: "Autopay", value: data.account.autopay_enabled ? "Enabled" : "Off" },
            { label: "Collections", value: formatLabel(data.account.collections_status) },
          ]}
        />
      )}

      <ProfileRecordTable
        title="Responsible Parties"
        records={data.payers}
        emptyMessage="No billing payers configured"
        columns={[
          { key: "payer_name", label: "Payer" },
          {
            key: "responsibility_percent",
            label: "Responsibility %",
            render: (row) => `${row.responsibility_percent ?? 0}%`,
          },
          {
            key: "is_primary",
            label: "Primary",
            render: (row) => (row.is_primary ? "Yes" : "No"),
          },
          { key: "custody_basis", label: "Custody basis", render: (row) => formatLabel(row.custody_basis) },
        ]}
      />

      <ProfileRecordTable
        title="Billing Contacts"
        records={billingContacts}
        emptyMessage="No billing contacts designated"
        columns={[
          {
            key: "name",
            label: "Guardian",
            render: (row) => `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
          },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          {
            key: "financial_responsibility_percent",
            label: "Responsibility %",
            render: (row) =>
              row.financial_responsibility_percent != null
                ? `${row.financial_responsibility_percent}%`
                : "—",
          },
        ]}
      />
    </div>
  );
}

export function TuitionSection(props: ProfileSectionViewProps) {
  const envelope = isFamilyProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    family: Record<string, unknown>;
    account: Record<string, unknown> | null;
    invoices: Record<string, unknown>[];
    payments: Record<string, unknown>[];
    paymentPlans: Record<string, unknown>[];
    credits: Record<string, unknown>[];
    students: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Tuition");

  return (
    <div className="space-y-6">
      {data.account ? (
        <ProfileStatGrid
          items={[
            { label: "Balance due", value: formatCurrency(Number(data.account.balance ?? 0)) },
            {
              label: "Credits",
              value: formatCurrency(Number(data.account.credit_balance ?? 0)),
            },
            { label: "Active plans", value: String(data.paymentPlans.length) },
            { label: "Students billed", value: String(data.students.length) },
          ]}
        />
      ) : (
        <ProfileCard title="Billing Account">
          <ProfileEmpty>No family billing account configured</ProfileEmpty>
        </ProfileCard>
      )}

      {envelope && data && (
        <FamilyFinancialCenter
          familyId={envelope.familyId}
          profile={data as Parameters<typeof FamilyFinancialCenter>[0]["profile"]}
        />
      )}

      <ProfileRecordTable
        title="Recent Invoices"
        records={data.invoices}
        emptyMessage="No invoices on file"
        columns={[
          { key: "invoice_number", label: "Invoice" },
          {
            key: "total_amount",
            label: "Total",
            render: (row) => formatCurrency(Number(row.total_amount ?? 0)),
          },
          {
            key: "amount_paid",
            label: "Paid",
            render: (row) => formatCurrency(Number(row.amount_paid ?? 0)),
          },
          { key: "invoice_status", label: "Status", render: (row) => formatLabel(row.invoice_status) },
          { key: "due_date", label: "Due" },
        ]}
      />

      <ProfileRecordTable
        title="Recent Payments"
        records={data.payments ?? []}
        emptyMessage="No payments recorded"
        columns={[
          {
            key: "amount",
            label: "Amount",
            render: (row) => formatCurrency(Number(row.amount ?? 0)),
          },
          { key: "payment_method", label: "Method", render: (row) => formatLabel(row.payment_method) },
          { key: "paid_at", label: "Paid at", render: (row) => formatLabel(row.paid_at) },
        ]}
      />
    </div>
  );
}

export function ScholarshipsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    scholarships: Record<string, unknown>[];
    stateFunding: Record<string, unknown>[];
    students: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Scholarships");

  return (
    <div className="space-y-6">
      <ProfileStatGrid
        items={[
          { label: "Approved scholarships", value: String(data.scholarships.length) },
          { label: "State funding records", value: String(data.stateFunding.length) },
          { label: "Students in household", value: String(data.students.length) },
        ]}
      />

      <ProfileRecordTable
        title="Scholarships"
        records={data.scholarships}
        emptyMessage="No approved scholarships on file"
        columns={[
          {
            key: "student",
            label: "Student",
            render: (row) => nestedName(row),
          },
          { key: "scholarship_type", label: "Type", render: (row) => formatLabel(row.scholarship_type) },
          {
            key: "approved_amount",
            label: "Approved",
            render: (row) => formatCurrency(Number(row.approved_amount ?? 0)),
          },
          {
            key: "remaining_award_balance",
            label: "Remaining",
            render: (row) => formatCurrency(Number(row.remaining_award_balance ?? 0)),
          },
          { key: "renewal_date", label: "Renewal" },
        ]}
      />

      <ProfileRecordTable
        title="State Funding"
        records={data.stateFunding}
        emptyMessage="No state funding records on file"
        columns={[
          { key: "student", label: "Student", render: (row) => nestedName(row) },
          { key: "program_name", label: "Program" },
          {
            key: "award_amount",
            label: "Award",
            render: (row) => formatCurrency(Number(row.award_amount ?? 0)),
          },
          {
            key: "verification_status",
            label: "Verification",
            render: (row) => formatLabel(row.verification_status),
          },
          { key: "payment_status", label: "Payment", render: (row) => formatLabel(row.payment_status) },
        ]}
      />
    </div>
  );
}
