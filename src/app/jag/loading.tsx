import { JagLoadingSkeleton } from "@/components/jag/command-center";

export default function JagLoading() {
  return (
    <div className="jag-command-center px-4 py-6 md:px-6">
      <JagLoadingSkeleton
        title="JAG Executive Command Center"
        description="Loading…"
        cards={6}
      />
    </div>
  );
}
