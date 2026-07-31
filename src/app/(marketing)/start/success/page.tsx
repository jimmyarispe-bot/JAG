import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndustry } from "@/lib/jag-business/industries";
import { getProvisionedOrganization } from "@/lib/jag-business/store";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";

export default async function StartSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org: organizationId } = await searchParams;
  if (!organizationId) notFound();
  const organization = getProvisionedOrganization(organizationId);
  if (!organization) notFound();

  const industry = getIndustry(organization.industry);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Welcome to The JAG™
      </h1>
      <p className="mt-3 text-slate-600">
        Your organization has been created.
      </p>

      <dl className="mt-10 space-y-3 rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
        <Row label="Organization" value={organization.organizationName} />
        <Row label="Organization ID" value={organization.organizationId} />
        <Row
          label="Founder"
          value={`${organization.founder.firstName} ${organization.founder.lastName}`}
        />
        <Row label="Email" value={organization.founder.email} />
        <Row
          label="Subscription"
          value={`${organization.subscription.planName} (${organization.subscription.status})`}
        />
        <Row label="Workspace" value={organization.workspace.name} />
        <Row label="Industry" value={industry?.name ?? organization.industry} />
      </dl>

      <Link
        href={`${JAG_PLATFORM_LOGIN_PATH}?next=/jag/dashboard`}
        className="mt-8 inline-flex rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Open The JAG
      </Link>
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
