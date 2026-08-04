# Organization provisioning (placeholder)

`/api/jag-business/provision` writes process memory only.
Durable orgs: Cloud Console `provisionOrganization` / identity `createOrganization`.
Customer org admins must receive `JAG_ORG_ADMIN`, never `FOUNDER`.

Data-plane: org operators only see/mutate their session-bound organization
(`listOrganizationsForSession` + `resolveSessionOrganization`). See
`docs/jag/213_DATA_PLANE_TENANT_ISOLATION.md`.
