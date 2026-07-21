# Rollback procedures

1. Revert application deploy to previous known-good image/commit  
2. Do **not** casually reverse migrations that drop columns — prefer forward-fix  
3. If migration must roll back: restore DB from pre-deploy backup (see DR doc)  
4. Disable flaky cron jobs via env/`CRON_SECRET` rotation if workers misbehave  
5. Communicate status via incident channel  
6. Re-run smoke + `validate:release` on restored build  

Prior rehearsal scripts: `npm run rc5:rollback`
