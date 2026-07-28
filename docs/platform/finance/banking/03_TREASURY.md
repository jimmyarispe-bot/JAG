# Treasury Operations

## Transfer kinds

- `internal` — same entity
- `intercompany` — auto when from/to entities differ
- `bank` — bank-to-bank
- `wire` / `ach` — placeholders (same approval pipeline; settlement adapters later)

## Approval policy

Per organization (`setTreasuryApprovalPolicy`):

- `singleApprovalLimit` — amounts at/above require approval
- `dualAuthLimit` — amounts at/above require two distinct approvers
- Creator cannot approve (segregation of duties)

## Cash concentration

`planCashConcentration` proposes surplus moves into a concentration account. It does not auto-execute.

## Cash position

`cashPosition` returns:

- Consolidated current / available / restricted / pending
- By entity
- By account (including department/program tags when set)
- `forecastingHookReady: true` only — **no forecasting engine**
