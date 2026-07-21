# Security review

## Verify

- RLS on tenant-scoped tables
- CSRF / cookie auth patterns (Supabase SSR)
- Rate limiting on public APIs where applicable
- Input validation on server actions
- Secrets only via env / vault (never committed)
- File upload MIME/size validation (Documents platform)
- Audit / activity completeness for destructive actions

## Commands

```bash
npm run validate:security
npm run security:audit-deps
npm run security:authz-inventory
```

## Prior evidence

See `docs/operations/rc3/`, `docs/operations/rc5/`, `docs/operations/rc10/04_SECURITY_PENTEST_STATUS.md`.
