import { OpportunityPage } from "@/components/exec/OpportunityPage";
import { loadExecOpportunities } from "@/lib/exec/load-opportunities";

export default function ExecOpportunitiesRoute() {
  const data = loadExecOpportunities();
  return <OpportunityPage data={data} />;
}
