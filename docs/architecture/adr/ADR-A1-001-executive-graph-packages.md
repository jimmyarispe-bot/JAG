# ADR-A1-001 — Dual Executive Graph packages

**Status:** Accepted  
**Date:** 2026-07-17  
**Phase:** Release A.1 Architecture Remediation  

## Context

Two packages exist:

| Package | Role |
|---------|------|
| `src/lib/platform/executive-graph/` | Sprint 004 builder (`buildExecutiveGraph`) — metrics/timeline oriented |
| `src/lib/platform/intelligence/executive-graph/` | Analyzer stack (`createExecutiveGraphAnalyzer`) used by intelligence DI, board governance, predictive |

Merging them in A.1 would be a high-risk rewrite without a product UI consumer for the analyzer.

## Decision

1. **Canonical analyzer for intelligence pipelines:** `@/lib/platform/intelligence/executive-graph`  
2. **Canonical builder for Sprint 004 graph artefacts:** `@/lib/platform/executive-graph`  
3. New code must not introduce a third graph package.  
4. Product UI (`/exec/graph`) must call the **analyzer** path when implemented.  
5. Full consolidation is deferred to a dedicated ADR after graph UI ships and tests cover both call sites.

## Consequences

- Duplicate concepts remain temporarily (documented debt).  
- Import discipline prevents further fragmentation.  
- Phase B+ may introduce a thin facade once UI contracts stabilize.
