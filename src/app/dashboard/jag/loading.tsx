import { RouteLoadingSkeleton, progressiveShellProps } from "@/components/experience-system";

export default function JagLoading() {
  const shell = progressiveShellProps("executive");
  return (
    <RouteLoadingSkeleton
      title="Executive Workspace"
      label="Loading Executive Workspace…"
      sidebarItems={shell.sidebarItems}
    />
  );
}
