# ADR-A1-002 — Platform finance/accounting engines vs operational finance

**Status:** Accepted  
**Date:** 2026-07-17  
**Phase:** Release A.1 Architecture Remediation  

## Context

- `src/lib/finance/` + Supabase tables = **operational** billing system of record.  
- `src/lib/platform/finance/` and `src/lib/platform/accounting/` = rich **in-memory** engines used mainly by unit tests / future GL bridge.

## Decision

1. Operational product paths must use `src/lib/finance/*` (and FI analytics).  
2. Platform engines remain libraries until a **persistence adapter** lands (Epic 10 P1).  
3. Do not duplicate COA/journal logic inside AcademyOS product modules.  
4. UI must not present in-memory engine output as posted GL truth.

## Consequences

- Temporary dual stack is intentional architecture, not accidental copy-paste.  
- Remediation of “duplicate finance” is adapter work, not deletion of either tree in A.1.
