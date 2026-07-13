# Behavioral Intelligence Architecture (Sprint 052)

## Placement

- **Domain key:** `behavioral`
- **Hard DAG:** `["reputation"]` (terminal after Reputation)
- **OIOS hard deps:** `["organization-dna", "reputation"]`
- **Layer:** Internal-facing behavioral after External / relationship reputation

## Soft reads (no circular imports)

stakeholder, reputation, human-capital, customer, executiveDecision, opportunity, predictive, knowledge

## Engines

1. BehavioralAnalysisEngine
2. DecisionModelingEngine â†’ DecisionModelingSuite
3. CognitiveBiasEngine â†’ CognitiveBiasSuite
4. MotivationEngine â†’ MotivationSuite
5. CollaborationEngine â†’ CollaborationSuite
6. ChangeAdoptionEngine â†’ ChangeAdoptionSuite
7. Forecast / Trend / Scenario engines
8. Recommendation composer
9. EarlyWarningEngine â†’ EarlyWarningSuite

## Closed learning destinations (7)

stakeholder, reputation, human-capital, customer, opportunity, executive-decision, predictive

Knowledge is soft-read inbound; contribution drafts are prepared in `knowledge-contribution.ts`.
