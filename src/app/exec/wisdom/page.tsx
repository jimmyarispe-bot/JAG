import { WisdomPage } from "@/components/exec/WisdomPage";
import { loadExecWisdom } from "@/lib/exec/load-wisdom";

export default async function ExecWisdomRoute() {
  const data = await loadExecWisdom();
  return <WisdomPage data={data} />;
}
