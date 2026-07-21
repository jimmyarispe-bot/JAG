# RC11 Go / No-Go

## Go when

- All `validate:*` gates in `rc11:suite` pass  
- Accessibility / mobile / performance gates at pass or accepted residual risk  
- Security audit + dependency audit clear  
- Background workers processing in staging  
- Core integrations registered via extension API  
- E2E/smoke green  
- Observability dashboard reachable  
- Deployment + rollback docs reviewed  

## No-Go when

- Any production-ready module has blocking release fail  
- Data-loss risk without backup  
- Critical RLS gap  
- Cron/worker path untested  
