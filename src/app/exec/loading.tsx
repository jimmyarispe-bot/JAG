import { RouteLoadingSkeleton, progressiveShellProps } from "@/components/experience-system";

export default function Loading() {
  const shell = progressiveShellProps("executive");
  return (
    <RouteLoadingSkeleton
      title={shell.title}
      label="Loading executive workspace…"
      sidebarItems={shell.sidebarItems}
    />
  );
}
