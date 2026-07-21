import type {
  OvernightIntelligence,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/briefing/types";

export function buildOvernightIntelligence(
  synthesis: SynthesisResultLight | undefined
): OvernightIntelligence {
  const risks = synthesis?.brief?.topRisks ?? synthesis?.risks ?? [];
  const opps = synthesis?.brief?.topOpportunities ?? synthesis?.opportunities ?? [];
  const domains = synthesis?.contributingDomains ?? [];

  const newRisks = risks
    .filter((r) => (r.severity ?? 0) >= 50)
    .map((r) => r.title ?? "New risk cluster")
    .slice(0, 5);
  const resolvedRisks =
    risks.length === 0
      ? ["No active elevated risks reported in the latest synthesis window."]
      : risks
          .filter((r) => (r.severity ?? 100) < 40)
          .map((r) => r.title ?? "Risk eased")
          .slice(0, 3);

  const newOpportunities = opps.map((o) => o.title ?? "Opportunity").slice(0, 5);

  const financialMovement = domains
    .filter((d) => /finance|revenue|funding|cash|accounting/i.test(d))
    .map((d) => `${d}: movement reflected in latest synthesis signals`);
  const complianceChanges = domains
    .filter((d) => /compliance|legal|ethical|risk/i.test(d))
    .map((d) => `${d}: compliance posture updated`);
  const marketChanges = domains
    .filter((d) => /market|competitive|economic|political/i.test(d))
    .map((d) => `${d}: external environment shift noted`);
  const staffingChanges = domains
    .filter((d) => /human-capital|hr|staff|teacher|cultural|behavioral/i.test(d))
    .map((d) => `${d}: staffing / people signal updated`);
  const fundingUpdates = domains
    .filter((d) => /funding|grant|revenue/i.test(d))
    .map((d) => `${d}: funding / revenue update`);
  const strategicChanges = domains
    .filter((d) => /wisdom|executive|strategy|innovation|opportunity/i.test(d))
    .map((d) => `${d}: strategic signal updated`);

  const summary =
    synthesis?.brief?.overnightSummary ??
    (synthesis
      ? `Overnight synthesis captured ${newRisks.length} risk signal(s) and ${newOpportunities.length} opportunity signal(s) across ${domains.length || "unknown"} domain(s).`
      : "Overnight intelligence unavailable — synthesis result was not provided.");

  return {
    summary,
    newRisks,
    resolvedRisks,
    newOpportunities,
    financialMovement: financialMovement.length ? financialMovement : ["No material financial movement highlighted."],
    complianceChanges: complianceChanges.length ? complianceChanges : ["No compliance deltas highlighted."],
    marketChanges: marketChanges.length ? marketChanges : ["No market deltas highlighted."],
    staffingChanges: staffingChanges.length ? staffingChanges : ["No staffing deltas highlighted."],
    fundingUpdates: fundingUpdates.length ? fundingUpdates : ["No funding deltas highlighted."],
    strategicChanges: strategicChanges.length ? strategicChanges : ["No strategic deltas highlighted."],
  };
}
