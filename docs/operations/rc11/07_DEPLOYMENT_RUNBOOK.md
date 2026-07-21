# Deployment runbook

1. Confirm `npm run rc11:suite` green on release branch  
2. Apply pending Supabase migrations (through `197`+ / latest) in staging, then production  
3. Set required env: `NEXT_PUBLIC_SUPABASE_URL`, service keys, `CRON_SECRET`, integration secrets  
4. Deploy Next.js app (`npm run build` && platform deploy)  
5. Smoke: `npm run test:smoke` against production URL  
6. Verify cron hits `/api/platform/process-queues`  
7. Confirm `/api/health` and `/api/ready`  
8. Sign off Release Dashboard (`/dashboard/executive/release`)
