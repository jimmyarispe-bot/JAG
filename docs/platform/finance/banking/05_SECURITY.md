# Treasury Security

## Permissions

Finance roles (`create`, `approve`, `post`, `financial_administrator`, …) gate banking operations. Sensitive actions (credential rotation, import rollback) require administrator.

## Controls

| Control | Behavior |
|---------|----------|
| Approval limits | Policy-driven single / dual thresholds |
| Dual authorization | Two distinct approvers; creator excluded |
| Account masking | `maskAccountNumber` — last4 only |
| Segregation of duties | Creator ≠ approver |
| Sensitive accounts | Restricted / escrow / trust flagged; available cash excluded from spendable totals |

## Notifications

- Large withdrawals  
- Returned payments  
- Failed imports  
- Transfer approvals  
- Bank connection failures  

## Audit

All connection, account, import, transfer, and transaction mutations write finance audit events.
