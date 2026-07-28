# Ledger

## Chart of accounts

Templates + user-defined accounts, numbering, types, subaccounts (`parentAccountId`), inactive accounts.

## Journal lifecycle

`draft` → `approved` → `posted` (optional `reversed` via reversing entry)

Kinds: standard · recurring · adjusting · reversing

## Period locking

`close_period` permission locks a `periodKey` (YYYY-MM). Locked periods reject new drafts.

## Not included

Bank reconciliation matching is deferred.
