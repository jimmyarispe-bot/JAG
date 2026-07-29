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
      <div className="rounded-md border border-dashed border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-10 text-sm text-[var(--jag-muted)]">
        This surface is reserved for a future Command Center page. Navigation is
        wired; no runtime or core changes are required to extend it.
      </div>
    </JagSection>
  );
}
