import { JagEmptyState } from "./JagEmptyState";
import { JagSection } from "./JagSection";

export function JagPlaceholderPage({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <JagSection title={title} description={description}>
      <JagEmptyState
        title="Reserved surface"
        description="This Command Center destination is wired in navigation for future expansion. No runtime or core changes are required to extend it."
      />
    </JagSection>
  );
}
