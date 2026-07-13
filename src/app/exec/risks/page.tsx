import { RiskPage } from "@/components/exec/RiskPage";
import { loadExecRisks } from "@/lib/exec/load-risks";

export default function ExecRisksRoute() {
  const data = loadExecRisks();
  return <RiskPage data={data} />;
}
