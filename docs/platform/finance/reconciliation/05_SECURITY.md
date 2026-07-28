# Reconciliation Security

## Roles

| Stage / action | Finance permission |
|----------------|--------------------|
| Reconciler | `reconcile` |
| Controller | `controller` |
| Finance Manager | `approve` |
| CFO | `cfo` |
| Close period | `close_period` |
| Reopen | `financial_administrator` |
| Auditor | `auditor` (read-only) |

## Controls

- Segregation of duties on multi-stage approval
- Permission-gated reopen after close
- Complete history: who matched, approved, changed; previous/current state
- Finance audit events mirrored for each history action
