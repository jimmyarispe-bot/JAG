import { JagSection } from "@/components/jag/command-center";
import { createEducationPolicyEngine } from "@/lib/domains/education";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export default async function JagPoliciesPage() {
  await requireJagPlatformAdminSession();
  const policies = createEducationPolicyEngine().registry().list();

  return (
    <JagSection
      title="Policies"
      description="Education policy definitions registered for evaluation (metadata only)."
    >
      {policies.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--jag-border)] px-4 py-8 text-sm text-[var(--jag-muted)]">
          No policies are registered.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--jag-border)] rounded-md border border-[var(--jag-border)]">
          {policies.map((policy) => (
            <li
              key={policy.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-[var(--jag-text)]">{policy.name}</p>
                <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                  {policy.id}
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                {policy.kind}
              </p>
            </li>
          ))}
        </ul>
      )}
    </JagSection>
  );
}
