import { JagSection } from "@/components/jag/command-center";
import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  EDUCATION_DOMAIN_VERSION,
  listCapabilityPacks,
} from "@/lib/domains/education";

export default function JagDomainsPage() {
  const packs = listCapabilityPacks();

  return (
    <JagSection
      title="Domains"
      description="Domain packages registered for JAG. Values come from the Education domain package — nothing is fabricated."
    >
      <div className="overflow-hidden rounded-md border border-[var(--jag-border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--jag-border)] bg-[var(--jag-panel)] text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Domain</th>
              <th className="px-4 py-2 font-medium">Id</th>
              <th className="px-4 py-2 font-medium">Version</th>
              <th className="px-4 py-2 font-medium">Packs</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--jag-border)] text-[var(--jag-text)]">
              <td className="px-4 py-3 capitalize">{EDUCATION_DOMAIN_NAME}</td>
              <td className="px-4 py-3 font-[family-name:var(--font-jag-mono)] text-xs text-[var(--jag-muted)]">
                {EDUCATION_DOMAIN_ID}
              </td>
              <td className="px-4 py-3 font-[family-name:var(--font-jag-mono)] text-xs">
                {EDUCATION_DOMAIN_VERSION}
              </td>
              <td className="px-4 py-3">{packs.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </JagSection>
  );
}
