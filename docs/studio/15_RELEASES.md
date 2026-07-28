# Release Manager & Artifacts

## Lifecycle

Development → Alpha → Beta → RC-1 → RC-2 → RC-3 → RC-4 → Certified → Released

Advances call the gate engine. Certified/Released also require a complete approval chain (Engineering → Architecture → QA → Executive → Release).

## Gate categories

| Category | Examples |
|----------|----------|
| Architecture | No violations; no circular deps |
| Testing | Suites passing; coverage threshold; no critical regressions |
| Documentation | API docs; release notes; upgrade guide |
| Security | No critical findings; permission validation |
| Operations | Deployment; rollback; backups |

Gates are stage-aware: later stages require more gates.

## Release artifacts

`generateReleaseArtifacts()` produces the canonical package:

- Release notes
- Migration summary
- PER summary
- Known issues
- Compatibility matrix
- Test summary
- Quality report
- Gate summary

## APIs

`GET /api/studio/releases` — list/get  
`GET /api/studio/releases?artifacts=1&productId=` — artifact package  
`GET /api/studio/releases?gates=1&productId=&targetStage=` — gate evaluation  
`POST` / `PATCH` — create / advance (gate-enforced)
