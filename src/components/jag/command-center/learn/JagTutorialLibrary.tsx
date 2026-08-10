import Link from "next/link";
import type { JagLearnTutorial } from "@/lib/jag-command-center/learning/client";
import { JagSection } from "../JagSection";

export function JagTutorialLibrary({
  tutorials,
}: {
  readonly tutorials: readonly JagLearnTutorial[];
}) {
  const orientation = tutorials.filter((t) => t.category === "orientation");
  const essentials = tutorials.filter((t) => t.category === "essentials");

  return (
    <div className="space-y-8" data-jag-page="learn-tutorials">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold text-[var(--jag-text)]">
          Tutorials
        </h1>
        <p className="text-sm text-[var(--jag-muted)]">
          JAG-native product tutorials. AcademyOS training is not listed here.
        </p>
      </header>

      <JagSection title="Orientation" description="Start here essentials.">
        <TutorialList items={orientation} />
      </JagSection>

      <JagSection
        title="Command Center essentials"
        description="Only surfaces you are authorized to use."
      >
        <TutorialList items={essentials} />
      </JagSection>
    </div>
  );
}

function TutorialList({ items }: { items: readonly JagLearnTutorial[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--jag-muted)]">
        No tutorials available for your current capabilities.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--jag-border)] rounded border border-[var(--jag-border)]">
      {items.map((t) => (
        <li key={t.id}>
          <Link
            href={`/jag/learn/tutorials/${t.slug}`}
            className="flex items-start justify-between gap-3 px-3 py-3 hover:bg-[var(--jag-panel)]"
          >
            <div>
              <p className="text-sm font-medium text-[var(--jag-text)]">
                {t.code} · {t.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--jag-muted)]">
                {t.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[var(--jag-muted)]">
              {t.estimatedMinutes} min
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
