# Exceptions & Adjustments

## Exception kinds

| Kind | Typical cause |
|------|----------------|
| `missing_transaction` | Book or bank side absent |
| `duplicate` | Same external id / near-identical lines |
| `amount_mismatch` | Partial / variance |
| `date_mismatch` | Outside tolerance |
| `unknown_payee` / `unknown_payer` | Uncategorized bank activity |
| `large_variance` | Statement vs book threshold |
| `policy_violation` | Finalize/close blocked |
| `missing_approval` | Required stage absent |

Exceptions emit `reconciliation.exception_created` for Digital Twin consumers.

## Adjustments

`journal_entry` · `correction` · `write_off` · `bank_fee` · `interest` · `fx` · `miscellaneous`

Posting an adjustment updates period book balance and emits `reconciliation.adjustment_posted`. Optional journal draft when COA exists.
