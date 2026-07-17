import { BriefPage } from "@/components/exec/BriefPage";
import { loadExecBrief } from "@/lib/exec/load-brief";

export default async function ExecBriefRoute() {
  const data = await loadExecBrief();
  return <BriefPage data={data} />;
}
