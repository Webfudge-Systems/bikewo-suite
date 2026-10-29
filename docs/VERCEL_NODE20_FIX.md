# Vercel Node 20 Pin (CRM / PM / Accounts)

## Summary

Vercel frontend deploys were failing on `npm install` because the monorepo install pulls in Strapi’s `better-sqlite3`, which does **not** support Node 26. Vercel was using Node **v26.13.0**, so the native addon failed to compile (`GetPrototype` / V8 API errors).

## Fix

1. Pin Node to **20.x** via:
   - Root `package.json` → `"engines": { "node": "20.x" }`
   - `.nvmrc` → `20`
   - `apps/crm`, `apps/pm`, `apps/accounts`, `apps/client-portal` `package.json` engines
2. Move `better-sqlite3` to `optionalDependencies` in `apps/backend` so a failed native build cannot abort frontend monorepo installs.

## Vercel project settings (confirm)

For each frontend project (Root Directory `apps/crm`, `apps/pm`, `apps/accounts`, …):

1. **Settings → General → Node.js Version** → **20.x**
2. Redeploy

`engines.node` in the app `package.json` should select 20 automatically; the dashboard override is a safety net if an old project still defaults to latest.
