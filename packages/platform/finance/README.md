# JAG Finance™ platform package

> **This package is not connected to a database.** Every store here is an
> in-memory `globalThis` Map. It is a single-process foundation for tests and
> local development. Do not wire UI to it and do not ship features on it until
> the module you need has been ported to Supabase.

## Why the guard exists

`runtime-guard.ts` throws if any store is touched when `VERCEL_ENV` is
`production` or `preview`. Without it the failure is silent — API routes return
200, writes appear to succeed, and the data is gone when the lambda recycles or
the next request lands on a different instance. For a finance system that is the
worst possible failure mode, so deployed environments fail loudly instead.

Local dev and `vitest` are unaffected. `JAG_ALLOW_EPHEMERAL_FINANCE=1` overrides
the guard; use it only for a throwaway demo where losing the data is fine.

## What is real and what is not

| Concern | Where it actually lives |
|---|---|
| Tuition plans, invoices, payments, family A/R, aging | `src/lib/finance/`, `src/lib/finance-platform/` — **real Supabase tables** |
| State scholarship awards, expected/received funding | `src/lib/admissions/state-funding.ts` — **real** |
| GL, chart of accounts, journal entries | here — **in-memory only** |
| AP, vendors, bills, purchase orders, 1099 | here — **in-memory only** |
| Treasury, cash position, bank feeds | here — **in-memory only** |
| Bank reconciliation matching | here — **in-memory only** |
| Budgets, forecasts, scenarios, allocations | here — **in-memory only** |
| Financial statements (P&L, balance sheet) | here — **in-memory only** |

Roughly 47 routes under `src/app/api/finance/` call into this package. As of
Aug 2026, exactly two `/api/finance/*` routes are referenced from any UI
(`board-export`), and those use `src/lib/finance/export.ts` — Stack A — not this
package.

## Porting a module to Supabase

The domain logic here is worth keeping; 86 of 108 files already carry
`school_id` / `organization_id` scoping and 40 reference permissions. What does
not survive the move is the **atomicity assumption**: in-memory Maps are
single-threaded, so a journal entry with balancing lines or a payment applied
across several invoices cannot half-happen. Postgres gives you none of that for
free — only one file in this package mentions transactions at all.

So, per module:

1. Keep the domain/logic files as-is where you can.
2. Replace the `store()` accessor with Supabase queries against real tables.
3. **Add an explicit transaction boundary** to every write path that touches more
   than one row — a Postgres function/RPC, not a sequence of client calls.
4. Add the tests it never had, against a real schema.
5. Remove the `assertEphemeralStoreAllowed` call from that store once it no
   longer backs anything.

Suggested order, driven by need rather than by what is easiest:
`revenue` / installments → `reconciliation` matching → `planning` → GL & chart of
accounts → `payables`. Intercompany links and 1099 can wait.

See `claude/finance-audit-and-roadmap.md` in the Claude project for the full audit.
