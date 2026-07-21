import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { loadExecIntegrationDetail } from "@/lib/exec/load-integrations";
import { ListSkeleton } from "@/components/experience-system";

const IntegrationDetailPage = dynamic(
  () =>
    import("@/components/exec/IntegrationDetailPage").then((m) => ({
      default: m.IntegrationDetailPage,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={8} label="Loading integration…" /> }
);

interface PageProps {
  params: Promise<{ instanceId: string }>;
}

export default async function ExecIntegrationDetailRoute({ params }: PageProps) {
  const { instanceId } = await params;
  const decoded = decodeURIComponent(instanceId);
  const data = await loadExecIntegrationDetail(decoded);
  if (!data) notFound();
  return <IntegrationDetailPage data={data} />;
}
