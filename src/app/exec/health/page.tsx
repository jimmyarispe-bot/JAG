import { HealthPage } from "@/components/exec/HealthPage";
import { loadExecHealth } from "@/lib/exec/load-health";

export default function ExecHealthRoute() {
  const data = loadExecHealth();
  return <HealthPage data={data} />;
}
