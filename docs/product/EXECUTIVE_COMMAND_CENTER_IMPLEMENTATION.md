# Executive Command Center — Implementation Decisions (B3)

**Status:** Phase 1 screens implemented  
**Routes:** `/exec` (spec paths preserved; auth gate mirrors executive intelligence access)

## Decisions

1. **Route placement** — Top-level `/exec/*` (not under `/dashboard/executive`) to match `EXECUTIVE_COMMAND_CENTER_SPEC.md` screen IDs. Dedicated `ExecShell` avoids double sidebars with the school dashboard.

2. **DI consumption** — All loaders call `getExecIntelligence()` (`react` `cache` around `createIntelligenceService()`). Pages never import domain engines directly.

3. **Data modes** — Widgets declare `live` | `model-baseline` | `synthetic` via `DataModeBadge`. Intelligence package defaults (no connectors) are labeled **Model baseline — connect data**. Proxies / simulated history are **Sample / simulated data**.

4. **Home sparks** — Finance uses OIOS financial dimension. Workforce / customer use labeled synthetic proxies from OIOS dimensions until HRIS/CRM soft-reads are wired in a later increment (avoids multi-second page loads from heavy domain builds).

5. **Risk taxonomy** — Financial / operational / legal / compliance / cyber / reputation map from LCR `enterpriseRisk`. Economic / political / environmental use labeled synthetic placeholders (decision: defer soft-reading those stacks in ECC until a shared request budget / warm cache exists; packages unchanged).

6. **Phase 2 nav** — Finance, Workforce, Customers, Predictive, Actions, Graph, Timeline, Ask JAG appear in nav as “Soon” (non-links).

7. **No intelligence package / API / graph changes** — ECC is a composition UI only.

## Loaders

| Screen | Loader | Primary stacks |
|--------|--------|----------------|
| Home | `load-home.ts` | oios, wisdom, opportunity |
| Brief | `load-brief.ts` | wisdom, oios, opportunity |
| Health | `load-health.ts` | oios, wisdom |
| Wisdom | `load-wisdom.ts` | wisdom, oios |
| Risks | `load-risks.ts` | legalComplianceRisk, wisdom |
| Opportunities | `load-opportunities.ts` | opportunity |

## Replace-later hooks

- Swap `dataMode` to `live` when connector-backed inputs are passed into domain `build({...})` requests.
- Replace synthetic health history with domain repository / institutional-memory history lists.
- Soft-read economic / political / environmental for Risk Center categories currently marked synthetic.
