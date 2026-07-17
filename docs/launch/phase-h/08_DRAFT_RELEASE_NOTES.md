# Draft Release Notes — AcademyOS 1.0 (HELD)

> **Status:** Draft only. **Do not publish** until Phase H decision flips to GO.

## Highlights (intended at GA)

- Unified AcademyOS on JAG Platform services (Identity, Permissions, Audit, Workflow, Notifications, Intelligence)  
- Admissions, SIS, Scheduling, Attendance, Teacher/Parent portals, Finance, HR, Executive surfaces  
- Security hardening waves (RLS invoker views, finance school scope, MFA enforcement hooks, storage policies)  
- UX accessibility foundations (focus trap, reduced motion, live announcer, route loaders)  

## Requirements for customers

- Modern Chromium, Firefox, Safari, Edge (versions TBD after cross-browser certification)  
- Supabase-backed tenancy; org/school scoped access  

## Known limitations at publish time

_Populate from `04_KNOWN_LIMITATIONS.md` at GO._

## Upgrade / migrate

1. Apply all migrations through current head (including 171, 172)  
2. Configure env per `PRODUCTION_ENV.md`  
3. Run certification / smoke on staging  

## Support

_Link support portal / email when GO._
