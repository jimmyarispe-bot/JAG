import { JagMetric, JagSection, JagStatusBadge } from "@/components/jag/command-center";
import {
  EDUCATION_KNOWLEDGE_MODEL,
  validateEducationKnowledgeModel,
} from "@/lib/domains/education";
import { requireJagPlatformAdminSession } from "@/lib/jag-platform/admin-access";

export default async function JagKnowledgePage() {
  await requireJagPlatformAdminSession();
  const validation = validateEducationKnowledgeModel(EDUCATION_KNOWLEDGE_MODEL);

  return (
    <JagSection
      title="Knowledge"
      description="Education Knowledge Model catalogs (definitions only)."
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--jag-muted)]">
        Model validation
        <JagStatusBadge status={validation.ok ? "ready" : "empty"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
          <JagMetric
            label="Entities"
            value={String(EDUCATION_KNOWLEDGE_MODEL.entities.length)}
          />
        </div>
        <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
          <JagMetric
            label="Policies"
            value={String(EDUCATION_KNOWLEDGE_MODEL.policies.length)}
          />
        </div>
        <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
          <JagMetric
            label="Capabilities"
            value={String(EDUCATION_KNOWLEDGE_MODEL.capabilities.length)}
          />
        </div>
        <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
          <JagMetric
            label="Vocabulary"
            value={String(EDUCATION_KNOWLEDGE_MODEL.vocabulary.length)}
          />
        </div>
      </div>
    </JagSection>
  );
}
