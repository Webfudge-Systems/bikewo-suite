# Vercel Node 24 Pin (CRM / PM / Accounts)

## Summary

Vercel frontend deploys were failing because:

1. Default/latest Node **26** broke Strapi’s `better-sqlite3` during monorepo `npm install` (native addon does not support Node 26).
2. Pinning to **20.x** then failed on Vercel: *Node.js Version "20.x" is discontinued* — Vercel requires **24.x**.

## Fix

1. Pin Node to **24.x** via:
   - Root `package.json` → `"engines": { "node": "24.x" }`
   - `.nvmrc` → `24`
   - `apps/crm`, `apps/pm`, `apps/accounts`, `apps/client-portal` `package.json` engines
2. Keep `better-sqlite3` in `optionalDependencies` on `apps/backend` so a failed native build cannot abort frontend monorepo installs.

Node **24** is supported by both Vercel and `better-sqlite3` (`20.x || 22.x || 23.x || 24.x`).

## Vercel project settings (confirm)

For each frontend project (Root Directory `apps/crm`, `apps/pm`, `apps/accounts`, …):

1. **Settings → General → Node.js Version** → **24.x**
2. Redeploy
