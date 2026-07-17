# Compliance Documentation Index — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Point operators to privacy/compliance controls as implemented and assessed |
| **Scope** | FERPA, COPPA, IDEA, §504 readiness documentation |
| **Audience** | Privacy, compliance, leadership, eng |
| **Prerequisites** | Phase B privacy assessment; legal counsel for formal certifications |
| **Version** | 1.0.0 |

---

## Important

This index **does not** certify legal compliance. Formal FERPA/COPPA attestations require counsel + operational evidence. Phase B assessed **gaps**.

Canonical assessment: `docs/security/phase-b/05_PRIVACY_COMPLIANCE_ASSESSMENT.md`.

---

## Control mapping (implementation pointers)

| Topic | Where |
|-------|-------|
| FERPA / student records | RLS + permissions; portal minimization gaps noted Phase B/D |
| COPPA | Under-13 flows — product/legal review required |
| IDEA / §504 | SpEd product UX incomplete (UX Phase D WF-01) |
| Privacy practices | Portal a11y bar ≠ privacy policy; publish org policy separately |
| Security controls | Phase B package; MFA not enforced |
| Data retention | Org policy + Supabase retention; automate deletion Wave F.1 |
| Audit logging | Admin audit UI + gaps (finance immutability) |
| Export procedures | Module export APIs — authorize + log |

---

## Procedures — Export request

1. Verify requester identity and legal basis.  
2. Use authorized export routes / admin tools only.  
3. Log export in audit.  
4. Transfer via secure channel.  
5. Retain ticket evidence.

## Procedures — Deletion request

1. Legal review.  
2. Engineering executes scoped delete with backups considered.  
3. Confirm storage objects.  
4. Document completion.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Oversharing to parents | Disable fields; eng + privacy |
| Audit gap | Treat as compliance risk; escalate |

## Related documents

- `docs/security/phase-b/05_PRIVACY_COMPLIANCE_ASSESSMENT.md`
- `docs/security/phase-b/SECURITY_REPORT.md`
- Compliance module UI `/dashboard/compliance`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Index + procedures |
