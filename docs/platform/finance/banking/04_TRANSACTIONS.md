# Transactions & Statement Imports

## Transaction statuses

`pending` · `posted` · `voided` · `imported` · `manual` · `corrected` · `split` · `linked`

Each mutation appends transaction audit history (`transactionHistory`).

## Operations

- Create (manual / imported)
- Status transitions, void, correct, split, link to AR/AP/journal records
- Rule engine: auto-categorization, vendor/customer matching, recurring pattern detection
- Exceptions: unknown, duplicate, missing reference, large, policy

## Statement imports

Formats: **CSV**, **OFX**, **QBO**, **Excel**, **PDF** (metadata registration; OCR hook ready).

Pipeline:

1. `previewImport` — duplicate detection, preview rows  
2. `validateImport`  
3. `commitImport` — creates `imported` transactions; syncs P-008 import list  
4. `rollbackImport` — voids imported transactions  

## Matching framework

Suggest / accept / reject candidates between transactions, deposits, payments, invoices, bills, journal entries.

**No reconciliation logic** in this sprint.
