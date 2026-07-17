# 08 — Executive Intelligence Performance

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |

---

## Pipeline architecture

`IntelligencePipelineImpl` executes modules in Kahn **waves**:

- Modules within a wave have **no mutual dependencies** → `Promise.all`  
- Waves remain sequential to preserve topological safety  
- `failFast` aborts **subsequent waves** after a wave containing failures  
- Module cache TTL still honored  

Registry API addition: `resolveWaves(moduleIds?)`.

---

## Default 39-module graph

Unit test order shows an essentially **linear chain** (max wave width ≈ 1 on the full default graph). Therefore:

| Scenario | Wall-time effect of Phase D waves |
|----------|-----------------------------------|
| Full default DAG | ≈ unchanged (depth-bound) |
| Partial graphs with sibling roots | **Material improvement** |
| Custom providers with true siblings | **Material improvement** (covered by unit test) |

Metadata on results: `waveCount`, `maxWaveWidth`.

---

## Shared context

`SharedIntelligenceContextBuilder` now loads executive / finance / student / organization providers **in parallel**. Unit test asserts `maxInFlight === 4`.

Estimated improvement vs sequential: up to **~4×** for provider I/O-bound builds (when each provider has similar latency).

---

## ECC loaders

`loadExecHome` already parallelizes connector `ensure*Synced` calls. Warm process singletons (Phase 1) keep DI/bootstrap near zero after first hit.

### Route load estimates (from Phase 1 local probe class)

| Route | Warm total class |
|-------|------------------|
| `/exec` home | Sub-second local |
| `/exec/brief`, health, opportunities, wisdom, risks | Sub-second local |

Cold process: add ~100 ms intelligence + ~64 ms integrations (historical Phase 1).

---

## Throughput limits

| Factor | Impact |
|--------|--------|
| Linear DAG depth | Dominates full-platform runs |
| AI provider latency | External; not parallelized across providers in all builders |
| Process-local OIOS maps | Horizontal inconsistency + memory |
| Cache | Helps identical re-runs within TTL |

---

## Recommendation

Treat Phase D wave engine as **scalability readiness** for future DAG branching; pair with product work to **reduce full-DAG necessity** on interactive paths (run targeted `moduleIds` only).
