# Studio repository scanner: the API surface it never enriches

Status: **diagnosed, validated in a container, ready to ship.** One file,
29 lines. An earlier attempt was reverted for reasons that turned out to be
measurement error - see the correction below.

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

## Shippable

Validated in a container against the same commit: seven tests fixed, none broken,
no timeout changes needed. The cost is ~5 minutes of extra suite time on the four
Studio files. On slow hardware those files were already ~15 minutes and will get
worse; run them in CI rather than locally if that matters.

## Historical note: why the first attempt was reverted

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

## Measured properly (container, Linux, same commit)

The earlier numbers in this document were taken on a Windows laptop that drifted
~5x slower over one session, and are not a clean attribution. Re-measured in a
cloud container where the whole suite runs in minutes:

| | baseline (458a82f) | with the fix |
|---|---|---|
| unit suite failures | 24 | **17** |
| unit suite wall | 333s | 647s |

Exactly seven tests go green - `js002` x3, `js004`, `js005` x2,
`repository-intelligence` - with no new failures. `studio-foundation` still
fails on `missingDocumentation`, which is unrelated to the scanner.

**No timeout changes are required.** The heaviest test peaks at ~102s against
its existing 120s ceiling. The +314s is entirely the four Studio files, which go
from ~100s to ~341s combined because the knowledge graph now contains the API
layer it was always supposed to contain.

The file-content cache described in earlier drafts was dropped: it recovered
~30% on the Windows machine's slow I/O and **nothing** in the container
(97.1s -> 101.8s, inside the noise). It was optimising a machine, not the code.

## Correction: there is no per-test escalation

An earlier version of this document claimed that each test in these files costs
roughly double the one before it, and that something accumulates which
`resetStudioStoreForTests()` fails to clear. **That was wrong.** Measured by
running each test in isolation and comparing against its time in sequence:

| test | alone | in sequence |
|---|---|---|
| densifies relationships | 3793ms | 3724ms |
| RC-3 readiness | 7489ms | 7114ms |
| generates recommendations | 11387ms | 11232ms |
| exposes graph health | 27583ms | 26903ms |

Identical. Nothing leaks. Instrumenting `afterEach` confirms every Studio global
(`__jagStudioStore`, `Certifications`, `Approvals`, `Policies`, `QualityWeights`,
`KnowledgeGraph`, `KnowledgeHealthTrend`, catalog snapshot, scan cache) is empty
after each test, and heap does not grow monotonically.

The tests are simply ordered cheapest to most expensive, which reads like
doubling. They are individually slow because each rebuilds the repository scan
and knowledge graph from disk - which is inherent to what they assert, not a bug.

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
