# Changelog — Intelligence Platform Infrastructure

## 0.1.0 — Sprint 027 (2026-07-12)

### Added

- Complete Intelligence Platform Infrastructure package under `intelligence/infrastructure`
- `IntelligenceModule` contract and built-in adapters for:
  - Organization Health
  - Financial Intelligence
  - Founder Intelligence
  - Executive Intelligence
  - Executive Graph Analyzer
  - Executive Decision Intelligence
- `IntelligenceRegistry` with dependency-ordered topological resolution
- `IntelligencePipeline` with timing, cache, metrics, lifecycle, and telemetry hooks
- `IntelligenceExecutionContext`, `IntelligenceProvider`, `IntelligenceLifecycle`
- `IntelligenceCache`, `IntelligenceMetrics`, `IntelligenceTelemetry`, `IntelligenceEvents`
- `IntelligenceScheduler`, `IntelligenceConfiguration`
- `IntelligenceHealth`, `IntelligenceDiagnostics`, `IntelligenceVersioning`
- DI factory `createIntelligencePlatform()`
- Wiring through `createIntelligenceService().intelligencePlatform`
- Unit tests, architecture docs, verification checklist, README

### Notes

- Extends existing architecture; does not regenerate Sprint 021–026 packages
- Distinct from domain routing (`IntelligenceDomainRegistry` / `IntelligenceDomainModule`)
