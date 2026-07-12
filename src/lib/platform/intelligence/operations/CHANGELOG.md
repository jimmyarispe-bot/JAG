# Changelog — Operations Intelligence

## 0.1.0 — Sprint 038

### Added

- Operations Intelligence domain package (`operations`)
- Core: `OperationsIntelligenceService`, `OperationsIntelligenceEngine`, `OperationsRepository`, `OperationsModels`, `OperationsDashboard`, `OperationsHealth`, `OperationsRegistry`
- Workflow health across 6 dimensions
- Process monitoring across 8 areas
- Staffing analytics, capacity planning (5 horizons), resource utilization
- Automation opportunities across 6 kinds
- Outputs: health/workflow/staffing/capacity/automation/risk scores, executive brief, dashboard, projection, risks, opportunities, recommendations
- Six-lens recommendation contract (`OperationsLensImpact`)
- DI via `createOperationsIntelligence()` returning `OperationsStack`
- Soft-reads DNA / OIOS / organization-health graph signals / human-capital / business-model / improvement
