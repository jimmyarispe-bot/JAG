# RC-5 — Release Version / Tag Recommendation

| Item | Recommendation |
|------|----------------|
| Pre-GA / RC tag | `v1.0.0-rc5` |
| GA tag (after E-001 + operator RLS/restore) | `v1.0.0` |
| Current `package.json` version | `0.1.0` (align to `1.0.0` at GA) |
| Existing tags observed | `v1.0.0`, `academyos-v1.0-rc-baseline`, … |

## Tagging procedure (when GO)

```bash
git tag -a v1.0.0-rc5 -m "RC-5 launch readiness (conditional)"
# After E-001 closed + operator evidence:
git tag -a v1.0.0 -m "AcademyOS 1.0.0 GA"
```

Do not force-push tags. Prefer annotated tags.
