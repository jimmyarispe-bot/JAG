import { OpportunityPage } from "@/components/exec/OpportunityPage";
import { loadExecOpportunities } from "@/lib/exec/load-opportunities";

export default async function ExecOpportunitiesRoute() {
  const data = await loadExecOpportunities();
  return <OpportunityPage data={data} />;
}
