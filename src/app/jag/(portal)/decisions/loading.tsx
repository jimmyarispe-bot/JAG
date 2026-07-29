import { JagLoadingSkeleton } from "@/components/jag/command-center";

export default function JagDecisionsLoading() {
  return (
    <JagLoadingSkeleton
      title="Decision Center"
      description="Loading executive decision queue…"
      cards={6}
    />
  );
}
