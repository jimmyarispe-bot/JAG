import { notFound } from "next/navigation";
import { IntegrationDetailPage } from "@/components/exec/IntegrationDetailPage";
import { loadExecIntegrationDetail } from "@/lib/exec/load-integrations";

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
