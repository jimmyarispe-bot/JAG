# RC-4 — Role Credential Matrix

Do **not** commit passwords. Store secrets in staging vault / 1Password.

| Role | Suggested email pattern | Home URL | Permissions focus |
|------|-------------------------|----------|-------------------|
| Founder | `founder+rc4@…` | `/dashboard` | Unrestricted / founder catalog |
| CEO | `ceo+rc4@…` | `/exec` | Executive + org health |
| School Leader | `leader+rc4@…` | `/dashboard` | School-scoped admin |
| Teacher | `teacher+rc4@…` | `/dashboard/teacher` | Teacher workspace |
| Parent | `parent+rc4@…` | `/portal` | Family portal |
| Student | `student+rc4@…` | `/portal/student` | Student portal |
| Employee | `employee+rc4@…` | `/dashboard/employee` | HR self-service |

## Env for harness

| Variable | Purpose |
|----------|---------|
| `RC4_BASE_URL` | Staging base URL |
| `RC4_E2E_COOKIE` | Session cookie for HTTP smoke |
| `LOAD_TEST_COOKIE` | Alternate cookie (shared with RC-2) |

## Seed checklist

1. [ ] Create seven persona users in staging Supabase Auth  
2. [ ] Assign org/school roles matching production catalog  
3. [ ] Seed minimal data: 1 lead, 1 student, 1 section, 1 invoice  
4. [ ] Capture cookie / storageState per role for Playwright  
5. [ ] Record evidence links in `08_SIGN_OFF.md`  
