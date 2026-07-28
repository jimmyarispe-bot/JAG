# 04 — Evidence Engine

Every extracted fact includes:

| Field | Purpose |
|-------|---------|
| Source document + version | Provenance |
| Location within document | Offset / page hint |
| Confidence | Extraction quality |
| Extraction method | ocr · parser · ner · classifier · manual · semantic · hook |
| Timestamp | `extractedAt` |
| Author | if known |
| Verification status | unverified → verified / disputed |

**Evidence NEVER disappears** (`tombstoned: false` always).

Citations are created automatically when facts are recorded. Summaries refuse to run without evidence.
