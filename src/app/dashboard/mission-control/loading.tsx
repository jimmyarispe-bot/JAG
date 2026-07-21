import { RouteLoadingSkeleton, progressiveShellProps } from "@/components/experience-system";

export default function Loading() {
  const shell = progressiveShellProps("executive");
  return (
    <RouteLoadingSkeleton
      title="Mission Control"
      label="Loading Mission Control…"
      sidebarItems={shell.sidebarItems}
    />
  );
}

