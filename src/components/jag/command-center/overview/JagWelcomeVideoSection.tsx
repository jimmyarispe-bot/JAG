import Link from "next/link";
import { JagLearningVideo } from "../learn/JagLearningVideo";
import { JagSection } from "../JagSection";

/**
 * Prominent Overview Welcome video — durable JAG-001 Mr. Jag instructional media.
 * Expects a runtime signed https URL (never a storage path or HeyGen temp URL).
 */
export function JagWelcomeVideoSection({
  videoUrl,
  tutorialHref = "/jag/learn/tutorials/welcome-to-the-jag",
}: {
  readonly videoUrl: string | null;
  readonly tutorialHref?: string;
}) {
  return (
    <JagSection
      title="Welcome to The JAG"
      description="Meet Mr. JAG™ — your guide to The JAG™ Command Center."
    >
      <div data-jag-overview-welcome-video="">
        <JagLearningVideo
          videoUrl={videoUrl}
          title="Welcome to The JAG"
        />
        <p className="mt-3 text-xs text-[var(--jag-muted)]">
          Continue with the interactive tutorial in{" "}
          <Link
            href={tutorialHref}
            className="underline-offset-2 hover:text-[var(--jag-text)] hover:underline"
          >
            Learning Center
          </Link>
          .
        </p>
      </div>
    </JagSection>
  );
}
