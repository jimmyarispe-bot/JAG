import { HomeDashboard } from "@/components/exec/HomeDashboard";
import { loadExecHome } from "@/lib/exec/load-home";

export default async function ExecHomePage() {
  const data = await loadExecHome();
  return <HomeDashboard data={data} />;
}
