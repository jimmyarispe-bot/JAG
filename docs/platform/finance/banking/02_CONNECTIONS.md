# Bank Connections

## Providers

| Provider | Status |
|----------|--------|
| Plaid | Interface ready (`plaidInterface`) |
| Open Banking | Future — connections may stay `pending` |
| Manual | Supported |
| Sandbox | Supported |

## Capabilities

- Multiple institutions per organization
- Multiple entities per connection
- Multiple currencies on accounts
- Credential rotation hooks (`rotateConnectionCredentials`) — schedules re-auth; **does not store secrets**

## Lifecycle

1. `registerInstitution`
2. `connectInstitution`
3. Link accounts via `createTreasuryAccount({ connectionId })`
4. `markConnectionStatus` / `rotateConnectionCredentials` as needed

Connection failures emit `connection_failure` notifications.
