# Greenfield baselines

Generated artifacts for initializing **new** JAG databases.

| File | Role |
|------|------|
| `GA_BASELINE_212.sql` | Certified initialization SQL through cutoff `212` |
| `manifest.json` | Provenance, inclusions, excluded historical repairs |
| `evidence/` | Source migration blob evidence |

Regenerate:

```bash
npm run db:baseline:build
npm run db:baseline:verify
```

Do not hand-edit `GA_BASELINE_212.sql`.
