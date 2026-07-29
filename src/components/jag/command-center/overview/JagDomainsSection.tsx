import Link from "next/link";
import { JagSection } from "../JagSection";
import { JagStatusBadge } from "../JagStatusBadge";
import type { JagLoadedDomainView } from "@/lib/jag-command-center";

export function JagDomainsSection({
  domains,
}: {
  readonly domains: readonly JagLoadedDomainView[];
}) {
  return (
    <JagSection
      title="Loaded Domains"
      description="Dynamically discovered domain packages. Education is registered; additional domains can be added later."
      actions={
        <Link
          href="/jag/domains"
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Domains
        </Link>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => (
          <article
            key={domain.id}
            className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-[var(--jag-text)]">
                {domain.name}
              </h3>
              <JagStatusBadge
                status={domain.status === "loaded" ? "ready" : "empty"}
              />
            </div>
            <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
              {domain.id} · v{domain.version}
            </p>
            <p className="mt-2 text-xs text-[var(--jag-muted)]">
              {domain.packCount} capability pack
              {domain.packCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--jag-muted)]">
              {domain.description}
            </p>
          </article>
        ))}
      </div>
    </JagSection>
  );
}
