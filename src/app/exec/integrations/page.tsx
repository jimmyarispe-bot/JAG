import { IntegrationsPage } from "@/components/exec/IntegrationsPage";
import { loadExecIntegrations } from "@/lib/exec/load-integrations";

export default async function ExecIntegrationsRoute() {
  const data = await loadExecIntegrations();
  return <IntegrationsPage data={data} />;
}
