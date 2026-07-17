# Testing Standards

1. New critical business logic requires unit tests in the same PR.  
2. New platform services require mocked integration tests.  
3. New routes that gate on auth must have smoke or E2E redirect coverage.  
4. Permission changes require matrix updates under `tests/unit/certification/` or IAM suites.  
5. Do not assign to a variable named `module` (Next.js ESLint rule).  
6. Fixtures must use `TEST_UUIDS` / deterministic IDs where persistence is involved.  
7. Tests must not depend on production credentials.  
8. Flaky sleeps are forbidden; use fake timers or explicit awaits on promises.
