import { JagSection, JagStatusBadge } from "@/components/jag/command-center";
import {
  listCapabilityPacks,
  validateEducationCapabilityRegistry,
} from "@/lib/domains/education";

export default function JagCapabilityPacksPage() {
  const packs = listCapabilityPacks();
  const validation = validateEducationCapabilityRegistry();

  return (
    <JagSection
      title="Capability Packs"
      description="Discoverable Education capability packs from the domain registry."
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--jag-muted)]">
        Registry
        <JagStatusBadge status={validation.ok ? "ready" : "empty"} />
      </div>

      {packs.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--jag-border)] px-4 py-8 text-sm text-[var(--jag-muted)]">
          No capability packs are registered.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {packs.map((pack) => (
            <article
              key={pack.id}
              className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-[var(--jag-text)]">
                  {pack.name}
                </h3>
                <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
                  v{pack.version}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--jag-muted)]">
                {pack.metadata.description}
              </p>
              <p className="mt-3 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                {pack.id}
              </p>
              <p className="mt-2 text-xs text-[var(--jag-muted)]">
                {pack.metadata.contributors.length} contributors ·{" "}
                {pack.metadata.plannerIntents.length} intents
              </p>
            </article>
          ))}
        </div>
      )}
    </JagSection>
  );
}
