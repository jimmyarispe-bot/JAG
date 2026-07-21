import { RouteLoadingSkeleton, progressiveShellProps } from "@/components/experience-system";

export default function Loading() {
  const shell = progressiveShellProps("hr");
  return (
    <RouteLoadingSkeleton
      title={shell.title}
      label={shell.label}
      sidebarItems={shell.sidebarItems}
    />
  );
}
