# 02 — Financial Statements

## Supported statements

| Kind | Description |
|------|-------------|
| `balance_sheet` | Assets, liabilities, equity from posted journals |
| `income_statement` | Revenue − expenses → net income |
| `cash_flow` | Cash-like asset movement summary |
| `equity_changes` | Equity account movements |
| `trial_balance` | Debits / credits by account |
| `general_ledger` | Posted journal line detail |
| `account_activity` | Activity lines with source refs |

## Comparative statements

Set `comparative: true` and/or `comparePeriodKey` to attach prior-period totals.

## Traceability

Each `StatementLine` includes `sourceRefs` pointing at `journal` records (and related operational records when tagged).

## Scopes

`entity` · `consolidated` · `department` · `division` · `program` · `campus` · `project` · `grant` · `fund` · `cost_center` · `class` · `custom`

Entity filtering uses journal/account `entityId`. Dimensional filters use unlimited dimension tags (see dimensions).

## API

`POST /api/finance/reporting/statements`  
`POST /api/finance/reporting/trial-balance`
