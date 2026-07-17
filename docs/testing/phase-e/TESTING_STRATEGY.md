# Testing Strategy (Phase E update)

Extends `docs/architecture/platform-testing-strategy.md`.

## Layers

1. **Build validators** — registry integrity fails the build  
2. **Unit** — pure logic, IAM, intelligence, connectors, certification packs  
3. **Integration** — platform services with mocked Supabase  
4. **Smoke E2E** — unauthenticated Playwright  
5. **Authenticated E2E (target)** — role journeys (Phase E.1)  
6. **Live isolation (target)** — RLS/storage with two orgs (Phase E.1)

## Principles

- Permission-based assertions only (no role hardcoding in tests of product authz)
- Prefer deterministic fixtures; never log secrets
- Mock external vendors in unit; sandbox evidence optional outside CI
- Coverage thresholds to be introduced in E.1 (`vitest --coverage`)

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:smoke
npm run build   # includes validate:* gates
```
