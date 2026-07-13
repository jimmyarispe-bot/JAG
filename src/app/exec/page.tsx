import { HomeDashboard } from "@/components/exec/HomeDashboard";
import { loadExecHome } from "@/lib/exec/load-home";

export default function ExecHomePage() {
  const data = loadExecHome();
  return <HomeDashboard data={data} />;
}
