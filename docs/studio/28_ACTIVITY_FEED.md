# Activity Feed

Recent Studio activity assembled from stored evidence — **no git required**.

`buildActivityFeed({ root?, limit?, ctx? })` returns `ActivityItem[]`, newest
first. `limit` defaults to **50**.

## Sources

| Source | Emits | Kind |
|--------|-------|------|
| Releases (`listReleases()`) | One item per release | `release` |
| Releases with `certifiedAt` | Certification event | `certification` |
| Release `migrationHistory` (first 8) | One item per entry | `commit` |
| Certification history (last 5 per product) | Stage changes with actor | `certification` |
| PERs | Current status per PER | `per` |

Certification records are read with `{ lightweight: true }` so building the feed
does not trigger a full gate evaluation per product.

## Shape

```ts
type ActivityItem = {
  id: string;
  at: string;
  kind: "commit" | "release" | "certification" | "per" | "documentation" | "recommendation";
  summary: string;
  evidence: readonly string[];
};
```

Ids are content-derived (`act:release:<id>`, `act:certhist:<product>:<at>`), so
the same tree yields the same feed and repeat entries collapse rather than
accumulate.

## Note on `commit`

The `commit` kind does not come from version control. It reports migration and
history entries recorded on a release — the name reflects how it reads in the
feed, not its source. Studio never shells out to git.
