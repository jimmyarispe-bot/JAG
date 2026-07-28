# Purchasing & Accounts Payable

## Purchasing flow

1. Purchase request  
2. Convert → purchase order (lines)  
3. Approval (creator cannot self-approve)  
4. Receiving (partial supported; over-receive blocked as backorder remainder)  
5. Vendor credits  

Attachments and audit on POs.

## AP

- Bills (foundation + recurring/credit flags)  
- Debit memos  
- Vendor statements  
- Payment scheduling (ACH, check, wire, virtual card hook)  
- Early payment discounts  
- Payment runs  
- 1099 YTD tracking for flagged vendors  

Foundation `createBill` / `approveBill` / `payBill` remain on `FinanceEngine` and `PayablesEngine`.
