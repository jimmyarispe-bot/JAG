import type { JagOrganizationContext } from "@/lib/platform/jag-organization";

function scopeLine(org: JagOrganizationContext): string {
  const s = org.activeScope;
  const parts: string[] = [];
  if (s.organizationName) parts.push(s.organizationName);
  if (s.schoolName) parts.push(s.schoolName);
  if (s.campusName) parts.push(s.campusName);
  if (s.departmentName) parts.push(s.departmentName);
  if (s.programName) parts.push(s.programName);
  if (s.positionTitle) parts.push(s.positionTitle);
  return parts.length ? parts.join(" · ") : "Enterprise scope";
}

function reportingLine(org: JagOrganizationContext): string | null {
  const chain = org.reporting.chain;
  if (chain.length < 2) return null;
  return chain.map((n) => n.name).join(" → ");
}

/** Compact organizational context for workspace shells — no hardcoded school assumptions. */
export function JagOrganizationContextBar({ org }: { org: JagOrganizationContext }) {
  const scope = scopeLine(org);
  const reporting = reportingLine(org);
  const owner = org.ownership.organizationalOwner.name;
  const knowledgeCount = org.ownership.knowledgeOwnerKeys.length;
  const workflowCount = org.ownership.workflowOwnerKeys.length;

  return (
    <div
      aria-label="Organizational context"
      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          <span className="font-medium text-slate-900">Scope:</span> {scope}
        </span>
        {reporting && (
          <span className="hidden sm:inline">
            <span className="font-medium text-slate-900">Reports through:</span> {reporting}
          </span>
        )}
        <span>
          <span className="font-medium text-slate-900">Owner:</span> {owner}
        </span>
        {(knowledgeCount > 0 || workflowCount > 0) && (
          <span className="text-xs text-slate-500">
            {knowledgeCount} knowledge · {workflowCount} workflow ownership
          </span>
        )}
      </div>
    </div>
  );
}

/** Expanded panel for insight regions and admin visibility. */
export function JagOrganizationContextPanel({ org }: { org: JagOrganizationContext }) {
  const scope = org.activeScope;

  return (
    <section aria-label="JAG Organization" className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">The JAG Organization™</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">{scopeLine(org)}</h2>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-900">Reporting chain</dt>
          <dd className="mt-1 text-slate-600">
            {org.reporting.chain.length
              ? org.reporting.chain.map((n) => n.name).join(" → ")
              : "Not linked to employee record"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Financial owner</dt>
          <dd className="mt-1 text-slate-600">{org.ownership.financialOwner.label}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Delegated authority</dt>
          <dd className="mt-1 text-slate-600">
            {org.authority.assignmentScopes.length} assignment scope
            {org.authority.assignmentScopes.length === 1 ? "" : "s"} ·{" "}
            {org.authority.grantedPermissions.length} permission
            {org.authority.grantedPermissions.length === 1 ? "" : "s"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Operational visibility</dt>
          <dd className="mt-1 text-slate-600">
            {org.visibility.accessibleSchoolIds.length} school
            {org.visibility.accessibleSchoolIds.length === 1 ? "" : "s"}
            {org.visibility.hasUnrestrictedAccess ? " · unrestricted" : ""}
          </dd>
        </div>
      </dl>

      {org.ownership.knowledgeOwnerKeys.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Knowledge ownership: {org.ownership.knowledgeOwnerKeys.slice(0, 4).join(", ")}
          {org.ownership.knowledgeOwnerKeys.length > 4
            ? ` +${org.ownership.knowledgeOwnerKeys.length - 4} more`
            : ""}
        </p>
      )}
    </section>
  );
}
