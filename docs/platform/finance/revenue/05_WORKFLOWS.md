# Workflows & OIOS Integration

Every material operational event calls `publishOperationalFinanceEvent`, which updates:

1. **Organizational Digital Twin** — projection row (`listTwinProjections`)  
2. **Evidence Ledger** — evidence record (`listEvidenceRecords`)  
3. **Organizational Memory** — memory record (`listMemoryRecords`)  

## Event types (selected)

| Event | When |
|-------|------|
| `finance.purchase_order_created` | PO create |
| `finance.purchase_order_approved` | PO approve |
| `finance.goods_received` | Receiving |
| `finance.bill_created` / `bill_approved` | AP bill |
| `finance.vendor_payment` / `payment_run` | Vendor pay |
| `finance.invoice_created` / `invoice_sent` | AR invoice |
| `finance.customer_payment` | Customer pay |
| `finance.collection_activity` | Collections / dunning |
| `finance.revenue_recognized` | Recognition |
| `finance.funding_applied` | Funding source on invoice |
| `finance.contract_created` | Contract |

## Collections

Aging · reminder rules · promise to pay · payment plans · dunning (`runDunning`).
