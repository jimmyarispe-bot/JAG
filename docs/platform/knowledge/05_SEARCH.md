# 05 — Search & Indexing

## Modes

| Mode | Behavior |
|------|----------|
| keyword | Title, tags, metadata, type filters |
| semantic | Cosine over vector-ready hash embeddings |
| hybrid | Merge keyword + semantic by score |

## Facets

Domain · typeKey · status

## AI-ready indexing

`indexDocument` builds deterministic 32-dim vectors (`hashVector`) suitable for later real embedding swap. Saved searches persist query + filters.
