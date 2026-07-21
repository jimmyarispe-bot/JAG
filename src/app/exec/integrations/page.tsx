import dynamic from "next/dynamic";
import { loadExecIntegrations } from "@/lib/exec/load-integrations";
import { ListSkeleton } from "@/components/experience-system";

const IntegrationsPage = dynamic(
  () =>
    import("@/components/exec/IntegrationsPage").then((m) => ({
      default: m.IntegrationsPage,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={8} label="Loading integrations…" /> }
);

export default async function ExecIntegrationsRoute() {
  const data = await loadExecIntegrations();
  return <IntegrationsPage data={data} />;
}
