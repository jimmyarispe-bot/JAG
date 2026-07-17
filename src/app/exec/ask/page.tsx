import { AskPage } from "@/components/exec/AskPage";
import { loadExecAsk } from "@/lib/exec/load-ask";

export default async function ExecAskRoute() {
  const data = await loadExecAsk();
  return <AskPage data={data} />;
}
