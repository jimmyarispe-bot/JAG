# 03 — Planning (Budgets, Forecasts, Scenarios)

## Budgets

Horizons: `annual` · `quarterly` · `monthly` · `rolling`  
Kinds: `operating` · `capital` · `department` · `program` · `project` · `grant`

Planning budgets wrap foundation `createBudget` (FinanceEngine store) and add versioning (`versionBudget`). Events: `finance.budget_created`, `finance.budget_versioned`.

## Forecasts

Methods: `rolling` · `bottom_up` · `top_down` · `department` · `revenue` · `expense` · `cash_placeholder`

Cash forecast is a **placeholder only** in P-012 (`cashPlaceholder: true` when method is `cash_placeholder`). Versions increment per name + period.

## Scenarios

Kinds: `best_case` · `expected` · `worst_case` · `custom`  
Assumptions are versioned and auditable. `compareScenarios` diffs assumption values across scenario versions.

## Allocations & assumptions

`postAllocation` records planning allocations with optional dimension filters.  
`setAssumption` versions assumption keys (optionally scoped to a scenario).

## API

`/api/finance/planning/budgets`  
`/api/finance/planning/forecasts`  
`/api/finance/planning/scenarios`
