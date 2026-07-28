# 06 — Knowledge API

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/knowledge/documents` | List / upload / ingest / version / OCR / classify / extract |
| GET/POST | `/api/knowledge/search` | Keyword / semantic / hybrid / index / saved |
| GET/POST | `/api/knowledge/evidence` | List / record evidence facts |
| GET/POST | `/api/knowledge/graph` | Query / nodes / relationships |
| GET | `/api/knowledge/timeline` | Chronological history |
| GET/POST | `/api/knowledge/summaries` | Evidence-backed summaries |
| GET/POST | `/api/knowledge/workflows` | Approval / review / … |

## Programmatic

```ts
import { createKnowledgeEngine } from "@knowledge";

const knowledge = createKnowledgeEngine();
const result = knowledge.ingest({
  organizationId: "org.1",
  userId: "u-1",
  title: "Invoice 1001",
  content: "Invoice for Vendor ACME\nDate: 2026-07-01",
  typeKey: "invoice",
});
```
