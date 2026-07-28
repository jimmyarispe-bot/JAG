# Reconciliation Workflows

## Period lifecycle

`open` → `matching` → `review` → `pending_approval` → `finalized` → `closed` → (`reopened`)

## Steps

1. **Open period** — account, cadence (monthly/quarterly/annual), scope (entity/department/program/project)
2. **Import statement** — attach statement import id; bank transactions feed matching
3. **Automatic matching** — high-confidence accepts + suggestions + exception seeding
4. **Suggested matches** — accept or ignore
5. **Review exceptions** — resolve before finalize
6. **Manual matching** — any cardinality including split/partial
7. **Adjustments** — journal, correction, write-off, bank fee, interest, FX, miscellaneous
8. **Approval** — reconciler → controller → finance manager → CFO
9. **Finalize** — requires reconciler approval + no open exceptions
10. **Close** — month-end; requires finalize or full approval chain
11. **Reopen** — `financial_administrator` only

## Approval segregation

- Auditor is read-only
- Period opener cannot approve controller+ stages
- Same user cannot approve multiple stages on one period
