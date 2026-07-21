# RC-4 — Role Journey Scripts

Use these as manual scripts or Playwright outlines. Do not redesign UI during RC-4 unless a blocker is found.

## Founder

1. Login → `/dashboard` Morning Brief loads  
2. Open Mission Control → actionable items visible  
3. `/dashboard/executive` → KPIs/decisions navigate  
4. `/dashboard/executive/strategic` → planning surface  
5. `/dashboard/finance/intelligence` → FI panels  
6. `/dashboard/admin` → org/settings reachable  
7. `/dashboard/integrations` → connectors list  
8. `/dashboard/admin/security` or `/dashboard/admin/audit` → audit visibility  
9. `/exec` → ECC shell  

**Pass:** Each step renders without error; decisions can be opened without engineer help.

## CEO

1. `/exec` → brief/health/ask reachable  
2. `/dashboard/executive/kpis` → KPI cards  
3. Admissions + Finance + HR + Compliance modules open  
4. `/dashboard/executive/reports` → report studio  

## School Leader

1. Admissions pipeline board loads  
2. Create/open lead (or open existing)  
3. Students list filtered to school  
4. Scheduling sections visible  
5. Teacher module accessible for assignment review  

## Teacher — full instructional day

1. Login → `/dashboard/teacher`  
2. Open today’s session (or sample session)  
3. Roster visible  
4. Mark attendance  
5. Add note / progress update  
6. Open student profile link  
7. Messaging entry reachable  

## Parent

1. `/portal` dashboard  
2. Progress + calendar  
3. Finance (balance/invoices UI)  
4. Documents  
5. Messages send/receive UI  

## Student

1. `/portal/student`  
2. Schedule  
3. Goals  
4. Messages  

## Employee

1. `/dashboard/employee` profile  
2. Linked HR documents/requests surfaces as configured  

## Forbidden checks

For each persona, deep-link a path outside role (e.g. parent → `/dashboard/admin`) → expect redirect or 403, not data.
