# Studio repository scanner: the API surface it never enriches

Status: **diagnosed, fix validated, not shipped.** Blocked on the test-runtime
problem in the last section, not on the fix itself.

## Symptom

`buildRepositoryIntelligence()` reports **0 API routes and 1 package** for a repo
containing **303 route handlers and 2 packages**. It raises no error. Every
consumer inherits the blind spot: the catalog, the architecture graph, the
knowledge graph, coverage metrics, API intelligence and release readiness are all
computed over evidence missing its entire API layer.

Nine tests fail as a result (`js002` x3, `js004`, `js005` x2,
`repository-intelligence`, and `academyos/operations-rc3` downstream).

## Cause

`packages/studio/repository/intelligence.ts`:

```ts
for (const entry of enrichTargets.slice(0, 400)) {
```

`apiRoutes` and `dependencyGraph` are populated **only** inside that loop, and the
cap applies in scan order. `SCAN_ROOTS` in `repository/scanner.ts` lists:

```
packages, apps, docs, tests, connectors, sdk, migrations, apis, src/app/api, ...
                                                            ^^^^^^^^^^^ ninth
```

Once `packages/` alone exceeded 400 matching entries, the loop never reached a
route handler and parsed only the first `package.json`. A threshold the
repository quietly grew past - it would have worked when written.

## Fix

Enrich structural entries unconditionally; apply the budget to the long tail only,
keeping the tail's original size so nothing that depended on it loses input.

```ts
const TAIL_ENRICH_BUDGET = 400;
const isStructural = (e: RepositoryIndexEntry): boolean =>
  (e.kind === "package" && e.path.endsWith("package.json")) ||
  e.path.startsWith("src/app/api/");

const structural = enrichTargets.filter(isStructural);
const tail = enrichTargets.filter((e) => !isStructural(e));
const tailEnriched = tail.slice(0, TAIL_ENRICH_BUDGET);

for (const entry of [...structural, ...tailEnriched]) { /* unchanged body */ }
```

Also surface truncation of the tail in `recommendations` - silent truncation is
what made the original cap so hard to see.

Two supporting changes measured as worthwhile:

- **Memoize the report**, invalidated by the *identity* of the scan it wraps
  (`cached.scan === scan`). `scanRepository` returns the same object until its
  cache is cleared, so the report rebuilds exactly when the scan behind it is
  dropped. Keying on the root string alone returns reports wrapping a discarded
  scan - that was tried and it broke `js002`.
- **Cache file reads by absolute path** in a small module. `resetStudioStoreForTests`
  clears the scan cache in `afterEach`, so every test re-read the tree from disk.
  Worth ~30% of the analysis path. Raw bytes keyed by path have no object
  identity to go stale, unlike a derived report.

Verified serially (`--no-file-parallelism`): `js002`, `js003` and
`repository-intelligence` fully green; the `js004`/`js005` graphs build with the
API layer present. Seven tests go from red to green on the enrichment fix alone.

## Why it is not shipped

Restoring ~300 API nodes and their edges makes the graph real, and the
graph-traversal tests scale with it. Their timeouts were calibrated against a
scanner returning almost nothing, so they need raising - but one test's runtime
will not hold still:

| Run | `js005 exposes graph health metrics` |
|---|---|
| before the fix | 42.7s (passing) |
| serial, after | 238.8s |
| 4 workers | 270.9s |
| 4 workers, again | **457.5s** (timed out at 420s) |

A ~2x swing between identical runs. Any ceiling picked for it is a guess, and
raising it further only hides the real problem.

## Caveat: the measurements above are contaminated

Taken at the end of the session, with the scanner fix fully reverted and the
tree byte-identical to HEAD, the same machine produced:

| Test (unchanged code) | first measurement | end of session |
|---|---|---|
| `js003 governance dashboard` | 27.9s | 148.1s |
| `js005 graph health dashboard` | 42.7s | 222.8s |

~5x slower on identical code, over a few hours. Long test runs, background
Vercel builds and thermal state all move this number, so any before/after
comparison in this document that spans hours overstates the cost of the fix.
The extra reads are real - enrichment goes from ~400 files to ~705 - but the
2x-to-4x figures quoted above are not a clean attribution.

Before deciding anything about this fix on performance grounds, re-measure both
arms back to back on an idle machine, serially, in one sitting.

## The real blocker: per-test escalation

Within a single file, each test costs roughly double the one before it, though
every test calls `resetStudioStoreForTests()` first:

| | before the fix | after |
|---|---|---|
| test 1 | 8.2s | 18.3s |
| test 2 | 8.5s | 23.6s |
| test 3 | 27.0s | 44.8s |
| test 4 | 43.2s | 137.9s |
| test 5 | 42.7s | 457.5s |

**This predates the scanner fix** (see the left column) - the fix amplifies it, it
does not cause it. Something accumulates across tests that
`resetStudioStoreForTests()` does not clear.

Fix this first. It is why the Studio suite takes ~15 minutes serially, it makes
every ceiling in these files guesswork, and once it is fixed the scanner fix
above costs almost nothing and can land as-is.

## Related, separate

- **Suite is unreliable at full parallelism.** Unbounded, vitest runs ~13 workers
  and they miss their own RPC deadlines: `[vitest-worker]: Timeout calling
  "onTaskUpdate" ... This might cause false positive tests`. Tests that pass in
  isolation fail in the suite. `claude-ship.ps1` now caps workers at 4 as a
  workaround. Predates all of the above.
- **Line endings.** `core.autocrlf` is unset and there is no `.gitattributes`, so
  85 files under `packages/studio/` show as fully modified on line endings alone
  (`git diff --stat` says 10,634 insertions; `--ignore-cr-at-eol` says 112).
  A `.gitattributes` with `* text=auto` plus one renormalisation commit fixes it.
