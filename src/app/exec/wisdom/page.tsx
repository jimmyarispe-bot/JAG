import { WisdomPage } from "@/components/exec/WisdomPage";
import { loadExecWisdom } from "@/lib/exec/load-wisdom";

export default function ExecWisdomRoute() {
  const data = loadExecWisdom();
  return <WisdomPage data={data} />;
}
