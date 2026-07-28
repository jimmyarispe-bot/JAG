# 03 — Canonical Metric Registry

Every CFO figure flows through `METRIC_REGISTRY` / `evaluateMetrics`.

| Key | Formula (summary) | Lineage |
|-----|-------------------|---------|
| revenue | SUM revenue balances | Ledger / reporting |
| gross_margin | (rev − direct) / rev | Ledger |
| operating_income | rev − expenses | Ledger |
| ebitda | op. income + D&A | Ledger + CFO |
| adjusted_ebitda | ebitda + adjustments | CFO adjustments |
| net_income | rev − expenses | Reporting KPIs |
| cash | treasury cashBalances | TreasuryEngine |
| working_capital | cash + AR − AP | Treasury / AR / AP |
| current_ratio | (cash+AR)/AP | Liquidity |
| quick_ratio | (cash+AR)/AP | Liquidity |
| debt_ratio | liabilities/assets | Ledger |
| ar_days | AR / (rev/days) | Revenue |
| ap_days | AP / (exp/days) | Payables |
| cash_conversion_cycle | AR days − AP days | Derived |
| operating_margin | net income / rev | Reporting KPIs |

Each definition includes: definition, formula, dataLineage, version, dimensions.
