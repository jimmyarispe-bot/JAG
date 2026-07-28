# Deterministic Reasoning

No LLM. Answers are produced only from graph edges, certification records, and release gates.

## Intents

| Intent | Example question |
|--------|------------------|
| `release_blocked` | Why is this release blocked? |
| `certification_failing` | Why is certification failing? |
| `per_responsible` | Which PER is responsible? |
| `api_owner` | Which package owns this API? |
| `module_reuse` | Which products reuse this module? |
| `preventing_rc3` | What is preventing RC-3? |
| `missing_docs` | Which documentation is missing? |
| `untested_services` | Which services have no tests? |
| `general_search` | Fallback graph search |

## Algorithm

1. Normalize question text.
2. Match intent by keyword rules (deterministic order).
3. Load graph + optional gate/certification evidence.
4. Walk typed edges (`OWNED_BY`, `VALIDATES`, `REFERENCES`, …).
5. Return `{ answer, evidence[], relatedNodeIds[], confidence }`.

## API

`GET /api/studio/knowledge/reason?q=…&productId=academyos`
