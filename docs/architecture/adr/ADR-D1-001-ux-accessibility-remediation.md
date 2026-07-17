# ADR-D1-001 — UX & Accessibility Remediation Approach

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-17 |

## Context

Phase D found Critical/High a11y and consistency gaps (unused focus trap, no reduced-motion, dual EmptyState, dead exec nav, misleading i18n copy, chart SR gaps).

## Decision

1. Wire existing XES primitives rather than inventing new libraries.  
2. Consolidate EmptyState to `ui/EmptyState`.  
3. Ship route `loading.tsx` + live announcer for perceived performance / status.  
4. Enable only implemented Exec routes; demote others to “Coming soon”.  
5. Clarify dual executive surfaces with labels/links — do not merge packages.  
6. Do not fabricate SpEd navigation.

## Consequences

- AA claim still requires manual certification.  
- Remaining forms migrate incrementally in D.2.  
- Founder nav includes Command Center entry.
