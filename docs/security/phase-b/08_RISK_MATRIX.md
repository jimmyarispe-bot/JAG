# Risk Matrix — Phase B

| ID | Finding | Likelihood | Impact | Severity | Owner area |
|----|---------|------------|--------|----------|------------|
| SEC-MT-01 | Report views bypass finance RLS | High | Critical | **Critical** | DB / FI |
| SEC-MT-02 | Finance tables via school-access only | High | High | **High** | Finance RLS |
| SEC-AUTH-01 | MFA not enforced | High | High | **High** | Identity |
| SEC-AUTH-02 | Public inquiry RPC abuse | High | High | **High** | Admissions |
| SEC-RLS-01 | Migration 171 unapplied risk | Medium | Critical | **Critical*** | Ops |
| SEC-API-01 | Weak/global rate limit | High | Medium | **High** | Platform |
| SEC-API-02 | schoolId IDOR pattern on exports | Medium | High | **High** | API |
| SEC-API-03 | AI context tenant IDs caller-controlled | Medium | High | **High** | AI |
| SEC-APP-01 | Missing CSP/HSTS/CSRF policy | Medium | High | **High** | App |
| SEC-APP-02 | Server Actions RLS-only authz | Medium | High | **High** | Admissions/Portal |
| SEC-DATA-01 | Parent medical/service overshare | Medium | High | **High** | Privacy |
| SEC-DATA-02 | student-documents storage policies missing | Medium | High | **High** | Storage |
| SEC-SEC-01 | Service-role client helper | Medium | High | **High** | Supabase |
| SEC-AUD-01 | In-memory finance audit | Medium | Medium | **Medium** | Finance |
| SEC-PAY-01 | square_planned payments | Medium | High | **High** | Finance |
| SEC-DEP-01 | Next/postcss moderate CVE | Low | Medium | **Medium** | Supply chain |
| SEC-PLAT-01 | platform_notes/relationships org weakness | Medium | High | **High** | Platform services |

\*Critical until every environment confirms `171` applied.

## Heat map (summary)

```
            Impact →
            Low    Med    High   Crit
Likely      ·      DEP    API01  MT01
            ·      AUD    AUTH   RLS01*
Med         ·      ·      many   ·
Low         ·      ·      ·      ·
```
