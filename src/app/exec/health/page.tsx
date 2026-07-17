import { HealthPage } from "@/components/exec/HealthPage";
import { loadExecHealth } from "@/lib/exec/load-health";

export default async function ExecHealthRoute() {
  const data = await loadExecHealth();
  return <HealthPage data={data} />;
}
