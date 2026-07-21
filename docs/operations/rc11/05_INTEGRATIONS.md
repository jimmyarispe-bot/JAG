# Priority integrations (extension architecture)

All providers plug into `src/lib/workflows/extension.ts` — **no direct coupling** to core modules.

| Provider | Extension id | Capability |
|----------|--------------|------------|
| Google Workspace | `google_workspace` | email, calendar, storage |
| Supabase Storage | `supabase_storage` | storage |
| Square | `square` | payments |
| Stripe | `stripe` | payments |
| QuickBooks Online | `quickbooks_online` | accounting |
| Twilio | `twilio` | sms |
| DocuSign | `docusign` | custom (e-sign) |
| Google Calendar / Meet | `google_calendar` | calendar |

Registration: `src/lib/production/integrations.ts` (imported by workers / process queues).

Configured adapters invoke live connectors when secrets are present; otherwise return `deferred: true`.
