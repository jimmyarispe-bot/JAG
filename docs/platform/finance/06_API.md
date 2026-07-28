# Finance API

All routes require session + `organizationId`.

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/finance/entities` | Entities, intercompany, bootstrap |
| GET/POST | `/api/finance/accounts` | COA templates, seed, create |
| GET/POST | `/api/finance/journals` | Create / approve / post / reverse / lock period |
| GET/POST | `/api/finance/vendors` | Vendor master |
| GET/POST | `/api/finance/customers` | Customer master |
| GET/POST | `/api/finance/budgets` | Budgets + scenario keys |
| GET/POST | `/api/finance/banking` | Bank accounts, imports, transfers |

Banking supports CSV/OFX/QBO/Excel imports; PDF is metadata-only (OCR later). Plaid/Open Banking interfaces are ready stubs.
