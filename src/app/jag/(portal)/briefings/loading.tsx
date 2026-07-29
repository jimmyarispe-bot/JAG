import { JagLoadingSkeleton } from "@/components/jag/command-center";

export default function JagBriefingsLoading() {
  return (
    <JagLoadingSkeleton
      title="Executive Briefings"
      description="Loading briefing archive…"
      cards={4}
    />
  );
}
