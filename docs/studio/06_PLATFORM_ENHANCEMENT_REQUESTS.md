# Studio Platform Enhancement Requests (PERs)

Studio-local gaps. Foundation remains frozen.

| ID | Gap | Workaround in pack |
|----|-----|--------------------|
| PER-EI-InsightProviders | Live EI dashboard does not consume SDK `InsightProvider`s | Studio registers `studio.platform-insights`; pack-local dashboard evaluate |
| PER-STUDIO-UI-SHELL | No dedicated Studio UI shell in platform nav | APIs + docs; host pages can mount later without Foundation edits |
| PER-STUDIO-COVERAGE-LIVE | Desire live coverage ingestion from CI | Testing Workspace accepts recorded runs via API |
| PER-STUDIO-CATALOG-PERSIST | Desire durable catalog across process restarts / multi-instance | In-process snapshot + `force` reindex; Foundation store optional |
| PER-STUDIO-GRAPH-UI | Interactive graph canvas in Platform UI | Graph/dashboard JSON APIs ready for a future Studio shell |
| PER-STUDIO-SEMANTIC-EMBED | Vector embeddings for deeper semantic search | Token + concept expansion search over catalog keywords |
| PER-STUDIO-CERT-PERSIST | Desire durable certification/approval store across instances | In-process Studio store; sign digests locally |
| PER-STUDIO-GATE-CI | Desire CI webhook to push live suite results into gates | Testing Workspace `recordRun` + gate coverage proxy |
| PER-STUDIO-KG-PERSIST | Desire durable Knowledge Graph across instances / restarts | In-process graph snapshot; rebuild via `force=1` |
| PER-STUDIO-KG-LIVE-EVENTS | Desire Foundation event stream to incrementally patch KG | Full rebuild from catalog + Studio registries |
| PER-EI-KG-PROVIDER | Desire EI core to natively consume Knowledge Graph signals | Studio reasoning + `studio.platform-insights` pack-local |

Any future Platform Core change must be approved against the Platform Constitution before implementation.
