# Privacy Compliance Assessment — Phase B

## Frameworks in scope

FERPA · COPPA (where under-13) · IDEA / Section 504 · State student privacy  

## Control summary

| Control | Status | Notes |
|---------|--------|-------|
| Data classification | Partial | Medical / SpEd / financial / executive classifications exist |
| Least privilege on medical/IEP | Partial | Core tables gated; reminders/services/parent alerts leakier |
| Parent access minimization | Partial | Family link ≠ legal custody verification |
| Consent capture | Partial | Forms exist; e-sign not fully wired |
| Retention / deletion | Incomplete | No platform-wide retention scheduler documented |
| Data export (DSAR) | Partial | EDP export center; not a formal privacy export workflow |
| Audit of sensitive access | Partial | Classification access events; incomplete coverage |
| COPPA parental consent | Incomplete | Not a dedicated verified flow |
| Minimization in AI context | Weak | Caller-controlled student ID lists |

## FERPA-oriented gaps

1. SpEd review reminders readable without `special_education` classification.  
2. Parent RLS exposes medical expiry alerts and service sessions broadly.  
3. Report views may expose aggregate student/finance metrics beyond need-to-know.  
4. Directory information vs educational records not clearly separated in product policy.

## Recommendations before claiming compliance readiness

- Legal review of parent portal field matrix.  
- Classification on all SpEd-adjacent tables.  
- Retention + deletion runbooks with school admin UI.  
- AI context: only authorized student IDs + redaction.  
- Document COPPA applicability per program (esp. Academy FL elementary).  
