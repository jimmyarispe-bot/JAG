# RC-6 Final Quality Gate

**Release candidate:** RC-6 (quality / security / performance / documentation cycle)  
**Gate date:** 2026-07-19  
**Purpose:** Formal, repeatable gate before moving from **internal pilot** to **external beta**  
**Evidence pack:** [README](./README.md) · [Quality](./RC-6-Quality-Audit.md) · [Security](./RC-6-Security-Audit.md) · [Performance](./RC-6-Performance-Audit.md) · [Documentation](./RC-6-Documentation-Audit.md) · [CHANGELOG](./CHANGELOG.md)

---

## Scorecard

| Area | Status | Evidence |
|------|--------|----------|
| Type Safety | ✅ | Avoidable `any` / `@ts-ignore` reduced; shared platform types; `tsc --noEmit` validated during RC-6.02 / RC-6.05 |
| Code Quality | ✅ | [RC-6-Quality-Audit.md](./RC-6-Quality-Audit.md) — production console noise removed; TODOs tracked as issues; barrels trimmed |
| UI Audit | ✅ | RC-6.03 — shipped-only exec nav; Ask JAG live; empty/loading states; synthetic samples hidden; stubs retargeted |
| Security | ✅* | [RC-6-Security-Audit.md](./RC-6-Security-Audit.md) — OAuth HMAC, IDOR/auth gates, timing-safe cron, RLS SQL in tree (*see accepted exceptions) |
| Performance | ✅* | [RC-6-Performance-Audit.md](./RC-6-Performance-Audit.md) — ECC direct build, dynamic imports, query/batch fixes, indexes SQL in tree (*see accepted exceptions) |
| Documentation | ✅ | [RC-6-Documentation-Audit.md](./RC-6-Documentation-Audit.md) — migration head, dual-stack map, releases pack, contract logging fix |

\* Green in-repo with **accepted exceptions** below. Exceptions must remain tracked until cleared; they do not silently expire.

---

## Gate rule

The release may proceed only if:

1. Every category above is ✅, **or**
2. Any non-green condition is recorded as an **Accepted Exception** (ID, owner, target release, acceptance) in this document.

---

## Accepted exceptions

| ID | Area | Exception | Accepted for | Clear-by | Owner | Tracking |
|----|------|-----------|--------------|----------|-------|----------|
| EX-RC6-SEC-01 | Security | Migration `181_rc604_integration_connections_org_rls.sql` not yet confirmed applied on target DB | Internal pilot | Before external beta | Platform / Ops | Apply via Supabase CLI/dashboard; verify policies on `integration_connections` |
| EX-RC6-SEC-02 | Security | `OAUTH_STATE_SECRET` must be set in each deploy environment (schema requires it; not yet listed in `PRODUCTION_ENV.md`) | Internal pilot | Before external beta | Platform / Ops | Add to prod env checklist; rotate if leaked |
| EX-RC6-PERF-01 | Performance | Migration `180_rc605_executive_perf_indexes.sql` not yet confirmed applied on target DB | Internal pilot | Before external beta | Platform / Ops | Apply; confirm indexes present |
| EX-RC6-PERF-02 | Performance | No staging `perf:regression` / load suite attached to this gate as numeric evidence | Internal pilot | Before external beta | Platform / QA | Run RC-10 perf suite; attach artifact or link |
| EX-RC6-DOC-01 | Documentation | Phase F API catalog lag; marketplace SDK long-form guide; intelligence surfaces map sync | Internal pilot **and** external beta | RC-7 / RC-10 docs freeze | Platform | Non-blocking for beta; track in docs backlog |
| EX-RC6-QUAL-01 | Code Quality | GitHub issues [#2](https://github.com/jimmyarispe-bot/JAG/issues/2)–[#5](https://github.com/jimmyarispe-bot/JAG/issues/5) (orchestrator follow-ups, vault/finance/Doc 98 wording) | Internal pilot **and** external beta | Next quality sprint | Engineering | Issue burn-down; not silent TODOs |

### Acceptance statement

These exceptions are **consciously accepted for internal pilot**.  
**EX-RC6-SEC-01, EX-RC6-SEC-02, EX-RC6-PERF-01, EX-RC6-PERF-02 must be cleared before external beta.**  
EX-RC6-DOC-01 and EX-RC6-QUAL-01 are accepted through external beta if still open, provided they remain tracked.

---

## Gate decision

| Audience | Decision |
|----------|----------|
| **Internal pilot** | **PROCEED** — all scorecard categories green with accepted exceptions documented |
| **External beta** | **HOLD** until EX-RC6-SEC-01, EX-RC6-SEC-02, EX-RC6-PERF-01, EX-RC6-PERF-02 are cleared and this section is updated to ✅ Clear |

### Clearance checklist (external beta)

- [ ] `181_rc604_integration_connections_org_rls.sql` applied (EX-RC6-SEC-01)
- [ ] `OAUTH_STATE_SECRET` set in staging + production (EX-RC6-SEC-02)
- [ ] `180_rc605_executive_perf_indexes.sql` applied (EX-RC6-PERF-01)
- [ ] Staging perf regression / load evidence attached (EX-RC6-PERF-02)
- [ ] Re-affirm or close EX-RC6-DOC-01 / EX-RC6-QUAL-01

When all beta-blocking exceptions are cleared, change **External beta** to **PROCEED** and record clearance date below.

**Clearance date (external beta):** _pending_  
**Signed off by:** _pending_

---

## Notes from gate preparation

1. Duplicate migration prefix `179` (`179_rc202_*` vs former `179_rc604_*`) was resolved by renumbering RC-6.04 RLS to **`181_rc604_integration_connections_org_rls.sql`**.
2. Migration head for docs: **181**.
3. Dual intelligence vs product packages remain documented in [`docs/platform/rc-packages.md`](../platform/rc-packages.md).
