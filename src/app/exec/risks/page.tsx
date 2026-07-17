import { RiskPage } from "@/components/exec/RiskPage";
import { loadExecRisks } from "@/lib/exec/load-risks";

export default async function ExecRisksRoute() {
  const data = await loadExecRisks();
  return <RiskPage data={data} />;
}
