import { RouteLoadingSkeleton, progressiveShellProps } from "@/components/experience-system";

export default function Loading() {
  const shell = progressiveShellProps("scheduling");
  return (
    <RouteLoadingSkeleton
      title={shell.title}
      label={shell.label}
      sidebarItems={shell.sidebarItems}
    />
  );
}
