# 09 — Performance Recommendations

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |

---

## P0 — before claiming high-volume readiness

1. **Paginate** `getStudents` / `getLeads` / `getFamilies` with stable APIs and UI page controls  
2. **Apply migrations 171–173** on staging + production; capture EXPLAIN on list queries  
3. **Cap** export/report routes (hard max rows + streaming)  
4. Run a **10k-student synthetic load** suite; record p95

## P1 — next engineering wave

5. Batch remaining N+1 (funding reconciliation, medical profiles)  
6. Externalize rate limits + job leases to Redis/Upstash consistently  
7. Dynamic-import heavy exec client islands  
8. Trigram indexes for search  

## P2 — architecture (may span phases)

9. Durable multi-tenant intelligence persistence (C-A1)  
10. Branch the intelligence DAG where domains are independent to exploit wave width  
11. Shared KPI snapshot cache with school-scoped keys + short TTL  

---

## Explicit non-goals (Phase D respected)

- No business logic / workflow / authz changes  
- No feature work  
- No blind `audit fix --force`  
- No merge of dual finance/executive stacks  

---

## Priority vs prior docs

Authoritative residual bottleneck IDs remain those in `docs/performance/phase-c/09_PERFORMANCE_BOTTLENECK_INVENTORY.md`. Phase D closes parallelization + index items without removing Critical list issues.
