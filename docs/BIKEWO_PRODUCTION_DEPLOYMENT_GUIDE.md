# BikeWo Production — Quick Checklist

> **Full guide:** [WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)  
> **Env files:** [ENV_FILES.md](./ENV_FILES.md)

## Repo & hosts

| Item | Value |
|------|--------|
| GitHub | `Webfudge-Systems/bikewo-suite` |
| Railway | `bikewo-suite` → `bikewo_suits` · root `apps/backend` |
| Vercel | Webfudge Systems team |

## Domains

| App | URL |
|-----|-----|
| API | `https://bikewo-suite-production.up.railway.app` |
| Landing | `https://bikewo.com` |
| CRM | `https://crm.bikewo.com` |
| PM | `https://pm.bikewo.com` |
| Accounts | `https://accounts.bikewo.com` |
| Orbit | `https://orbit.10x1.webfudge.in` |
| Portal | `https://portal.bikewo.com` |

## Deploy order

1. Copy `apps/backend/.env.production` → Railway (fill `DATABASE_URL`, `REDIS_URL` from dashboards).
2. Postgres Path **A** (keep) / **B** (import) / **C** (empty) — see main guide.
3. Redis linked → `REDIS_URL`.
4. API live → `/api/apps`.
5. Copy each `apps/*/.env.production` → matching Vercel project → redeploy.
6. DNS + smoke tests.

## Local dev

```bash
cp apps/backend/.env.local apps/backend/.env
npm run dev:backend
npm run dev:crm   # :3001
npm run dev:pm    # :3005
```
