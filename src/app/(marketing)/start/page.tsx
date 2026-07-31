import { StartPilotWizard } from "@/components/jag-marketing/StartPilotWizard";

export default async function StartPilotPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return <StartPilotWizard initialPlanId={plan} />;
}
