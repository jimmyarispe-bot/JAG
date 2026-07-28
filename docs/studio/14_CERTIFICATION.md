# Product Certification Engine

Every Studio product maintains a `CertificationRecord`.

## Tracked fields

| Field | Description |
|-------|-------------|
| Current version | Synced from product registry |
| Release stage | Development → … → Released |
| Required gates | Gate ids required for the current stage |
| Outstanding blockers | Failed required gates |
| Certification history | Stage transitions with actor/note |
| Signed artifacts | Digests of generated release packages |
| Approval history | Role-based decisions |

## Release stages

```
Development → Alpha → Beta → RC-1 → RC-2 → RC-3 → RC-4 → Certified → Released
```

Legacy status `"RC"` is treated as `RC-1` for ranking.

AcademyOS is seeded at **RC-2** after validation + hardening evidence.

## APIs

- `GET /api/studio/certification` — list all
- `GET /api/studio/certification?productId=` — record + workflow
- `POST` with `action=refresh|sign` — refresh or sign release package
