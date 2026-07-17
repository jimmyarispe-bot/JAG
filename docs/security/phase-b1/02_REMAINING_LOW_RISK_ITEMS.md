# Remaining Low / Medium Items — After B.1

| ID | Severity | Item | Disposition |
|----|----------|------|-------------|
| SEC-APP-02 | Medium | Exhaustive Server Action permission asserts | Continue in B.2 — pattern established |
| SEC-AUD-01 | Medium | Immutable finance audit DB | B.2 |
| SEC-DEP-01 | Medium | Next/postcss moderate CVE | Track Next upgrade; CI audit gate |
| M-01 | Low | Deprecated MFA role constants | Keep deprecated; unused for authz |
| Live JWT RLS suite | High→Accepted residual until suite lands | Schedule pen-test plan execution | Must complete before multi-tenant go-live |
| Account lockout durability | Medium | Supabase Auth + app throttle (IP/email done) | Enhance with Auth hooks B.2 |
| CSRF explicit tokens | Medium | SameSite cookies + headers; document strategy | B.2 |
| Malware scanning | Low | Integration point only (not implemented) | Product decision |
| Full OpenAPI authz matrix | Low | Phase F Wave F.1 | Docs |

**Formal acceptance:** Live cross-org RLS JWT suite is **not** closed in B.1 code; production multi-tenant launch remains blocked on that evidence even though Critical code paths are remediated.
