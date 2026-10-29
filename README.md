# BikeWo Suite

Internal business suite for **BikeWo**: monorepo built by [Webfudge Systems](https://webfudgesystems.in).

CRM, project management, accounts, client portal and a LinkedIn extension, all on one **Strapi API** using **npm workspaces**.

This is a **single-organization** deployment. There is one organization, **BikeWo**, created automatically the first time someone logs in to an empty database. Every other user is invited from the Accounts app. There is no public org signup and no organization manager.

---

## Apps

| App | Path | Package | Port | Hosting |
| --- | --- | --- | ---: | --- |
| CRM | `apps/crm` | `@bikewo/crm` | 3001 | Vercel |
| Client portal | `apps/client-portal` | `@bikewo/client-portal` | 3002 | Vercel |
| Accounts | `apps/accounts` | `@bikewo/accounts` | 3003 | Vercel |
| PM | `apps/pm` | `@bikewo/pm` | 3005 | Vercel |
| LinkedIn extension | `apps/linkedin-extension` | `@bikewo/linkedin-extension` | – | Chrome (unpacked / store) |
| **API** | `apps/backend` | `backend` | 1337 | Railway |

Shared: `@webfudge/ui`, `@webfudge/auth`, `@webfudge/utils`, `@webfudge/config`.

---

## Repository structure

```
bikewo-suite/
├── apps/
│   ├── crm/
│   ├── pm/
│   ├── accounts/
│   ├── client-portal/
│   ├── linkedin-extension/   # Chrome extension → imports LinkedIn profiles into CRM
│   └── backend/              # Strapi 5 API
├── packages/
│   ├── ui/
│   ├── auth/
│   ├── config/
│   └── utils/
├── tooling/
└── docs/
```

**Tooling:** Turborepo + npm workspaces.

---

## Getting started

Prerequisites: Node.js **20.x** and npm **>= 9** (Vercel frontends are pinned to 20.x).

```bash
npm install
```

### Development

```bash
npm run dev:backend         # Strapi → http://localhost:1337/admin
npm run dev:crm             # http://localhost:3001
npm run dev:client-portal   # http://localhost:3002
npm run dev:accounts        # http://localhost:3003
npm run dev:pm              # http://localhost:3005
npm run build:linkedin-extension   # outputs apps/linkedin-extension/dist (load unpacked)
```

`npm run dev` starts every frontend (not the backend).

To reset the local SQLite DB (dev only):

```bash
npm run reset:db
```

### Environment

Strapi reads only `apps/backend/.env`. It is currently set up for local SQLite (`.tmp/data.db`).
`apps/backend/.env.production` is a template, so fill in BikeWo's own Postgres, Redis and secrets before deploying.

```bash
cp apps/crm/.env.example apps/crm/.env.local
cp apps/pm/.env.example apps/pm/.env.local
cp apps/accounts/.env.example apps/accounts/.env.local
cp apps/client-portal/.env.example apps/client-portal/.env.local
```

See **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)**.

### Build

```bash
npm run build
npm run build:crm
```

---

## Authentication

JWT auth via **Strapi** (`apps/backend`). Workspace apps use **`@webfudge/auth`** and send **`X-Organization-Id`** (always the BikeWo org). Roles, permissions and departments are scoped to that organization.

---

Built by **Webfudge Systems** for BikeWo.
