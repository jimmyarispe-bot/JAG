# 5. Upgrade Guide

## From prior AcademyOS / JAG builds to 1.0 RC

1. Merge/deploy application build that passes `npm run build`.  
2. Apply pending Supabase migrations in order (see Migration Guide).  
3. Update env vars (especially `VAULT_ENCRYPTION_KEY`, `CRON_SECRET`, SendGrid).  
4. Invalidate sessions if auth/MFA policy changed (`ENFORCE_MFA`).  
5. Run smoke against target URL.  
6. Verify privileged users can complete MFA path if enforced.

## Feature flags / modules

Use organization/module configuration; do not enable unfinished Executive Phase-2 surfaces for customers.
