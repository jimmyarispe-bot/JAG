# Sprint 213 — JAG External Pilot Foundation II

End-to-end data-plane tenant isolation (application layer).

**Status:** Implemented in app code.  
**Not in scope:** Applying migration 212, Pilot Control Center UI, inviting external pilots, live Supabase/Vercel changes.

## Problem closed

Foundation I minted org-bound sessions and `sessionCanAccessOrganization`, but most Command Center loaders and mutations still soft-selected `orgs[0]` / trusted client `organizationId` without the session gate.

## Canonical helpers

| Helper | Role |
|--------|------|
| `sessionCanAccessOrganization` | Binary ACL (platform vs bound org) |
| `resolveSessionOrganization` | Fail-closed org resolution for loaders |
| `assertSessionCanAccessOrganization` | Mutation guard |
| `listOrganizationsForSession` | ACL source (org operators → bound org only) |
| `listAccessibleEvidenceOrganizations` / `canAccessEvidenceOrganization` | Evidence/connectors APIs |

## Multi-org minting

`resolveJagOrganizationContext` no longer silently picks `memberships[0]`:

- Preferred membership when valid
- Else unique primary
- Else unique membership
- Else org operator → **null** (fail closed); platform steward → unbound

## Surfaces hardened

- Command Center loaders (memory, decisions, briefings, inbox, strategy, scenarios, forecasts, graph, conversation, executive overview, branding, tenant-admin)
- Mutations (memory, branding, tenant-admin, decisions, briefings, watchers, conversation)
- Evidence / connector access (no soft first-org on invalid preferred)
- Observability audit list (org-filtered)
- Priorities detail page

## Pre-commit hardening (post-review)

Closed before commit:

- Conversation list/active/mutations resource-bound ACL
- Decision mutations authorize via `getDecisionCenterDetail` (not client `organizationId`)
- Observability observation streams filtered by session org
- Briefing list fail-closed on null org; briefing mutations ACL-gated (incl. share link)
- `approveBriefingDecision` binds decision via Decision Center ACL + briefing reference
- `loadJagSearchCatalog` scopes briefings to session-accessible orgs only

## Remaining (out of this sprint)

1. Apply migration 212 in Supabase  
2. `/jag/admin/organizations` control plane  
3. Durable pilot invite (`JAG_ORG_ADMIN` + membership)  
4. Live RLS penetration against Preview/Production  
