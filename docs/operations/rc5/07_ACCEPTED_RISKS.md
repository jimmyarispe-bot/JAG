# RC-5 — Accepted Risks & Deferrals

| ID | Class | Title | Rationale |
|----|-------|-------|-----------|
| E-001 | **Release blocker for GA** | Authenticated multi-role E2E not executed | Harness ready; staging persona passwords not in this environment |
| G-RC1-02 | Accepted risk / deferred | Live dual-org RLS soak | Harness ready; needs `RC5_RLS_A_COOKIE` + `RC5_RLS_B_COOKIE` |
| G-RC1-08 | Accepted risk / deferred | Physical PITR restore | Harness ready; needs scratch project + `RC5_RESTORE_BASE_URL` |
| Vercel promote | Deferred improvement | Production previous-deployment promote | Set `RC5_ROLLBACK_CONFIRMED=1` after operator drill |
| RISK-NEXT-POSTCSS | Accepted risk | Nested postcss moderate CVE | RC-3 accepted; no `npm audit fix --force` |
| A11Y-AUTH | Deferred improvement | Authenticated axe on portal/teacher/exec | Blocked on E-001 personas |
| PKG-VERSION | Deferred improvement | `package.json` still `0.1.0` | Align on GA tag `v1.0.0` |

## Classification key

- **Release blocker** — blocks production GA
- **Accepted risk** — documented, consciously accepted for CONDITIONAL_GO / pilot
- **Deferred improvement** — post-GA or next hardening sprint
