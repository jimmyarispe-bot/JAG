import { RouteLoadingSkeleton, progressiveShellProps } from "@/components/experience-system";

export default function Loading() {
  const shell = progressiveShellProps("finance");
  return (
    <RouteLoadingSkeleton
      title={shell.title}
      label={shell.label}
      sidebarItems={shell.sidebarItems}
    />
  );
}
