# Changelog — Business Model Intelligence

## 0.1.0 — Sprint 037

### Added

- Business Model Intelligence domain package (`business-model`)
- Core: `BusinessModelIntelligenceService`, `BusinessModelIntelligenceEngine`, `BusinessModelRepository`, `BusinessModelModels`, `BusinessModelDashboard`, `BusinessModelHealth`, `BusinessModelRegistry`, `BusinessModelSimulator`
- Business Model Canvas (9 blocks) + Lean Canvas (9 blocks)
- Organization design suite (11 model kinds)
- Scenario planning (8 scenario kinds)
- Simulation with 8 forecast dimensions + multi-model comparison
- Outputs: health score, canvases, executive brief, alternatives, competitive position, risks, opportunities, evolution roadmap
- Six-lens recommendation contract (`BusinessModelLensImpact`)
- Platform module `business-model` + OIOS active registration
- DI via `createBusinessModelIntelligence()` and `createIntelligenceService().businessModel`
