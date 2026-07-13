import { BriefPage } from "@/components/exec/BriefPage";
import { loadExecBrief } from "@/lib/exec/load-brief";

export default function ExecBriefRoute() {
  const data = loadExecBrief();
  return <BriefPage data={data} />;
}
