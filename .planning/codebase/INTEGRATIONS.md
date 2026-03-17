# Codebase Integrations

## Overview
- The codebase currently integrates local apps with each other more than it integrates external services.
- The only clearly implemented runtime integration is `apps/agent` sending data to `apps/server` over HTTP, then `apps/server` persisting to SQLite.
- Blockchain support exists as an independent package but is not yet wired into the backend flow.

## Internal Service Integration
- Agent sends logs to backend through `apps/agent/src/http/logApiClient.ts`.
- Agent also reports its sync state through `apps/agent/src/http/logApiClient.ts`.
- Server mounts API routes in `apps/server/src/routes/index.ts`.
- Log ingestion endpoint is defined in `apps/server/src/routes/logRoutes.ts`.
- Agent state endpoint is also defined in `apps/server/src/routes/logRoutes.ts`.

## HTTP API Surface
- Health endpoint: `GET /api/health` from `apps/server/src/routes/healthRoutes.ts`.
- Log endpoints: `POST /api/logs`, `GET /api/logs` from `apps/server/src/routes/logRoutes.ts`.
- Agent state endpoint: `POST /api/agents/state` from `apps/server/src/routes/logRoutes.ts`.
- Overview endpoint: `GET /api/overview` from `apps/server/src/routes/overviewRoutes.ts`.
- Audit endpoint: `GET /api/audits` from `apps/server/src/routes/auditRoutes.ts`.
- Alert endpoint: `GET /api/alerts` from `apps/server/src/routes/alertRoutes.ts`.

## Database Integration
- Backend uses `sql.js` rather than a native SQLite driver in `apps/server/package.json`.
- SQLite initialization and file persistence are handled in `apps/server/src/db/sqliteClient.ts`.
- Schema definitions live in `apps/server/src/db/schema.ts`.
- Storage target is described under `storage/sqlite/README.md`.

## Frontend Data Integration
- Frontend currently uses mock data instead of the real backend.
- Mock client is implemented in `apps/web/src/api/mockClient.ts`.
- Mock data lives in `apps/web/src/mock/data.ts`.
- Pages consuming mock data include `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/LogsPage.tsx`, `apps/web/src/pages/AuditPage.tsx`, and `apps/web/src/pages/AlertsPage.tsx`.

## Blockchain Integration
- Smart contract entry point is `packages/contracts/contracts/LogRegistry.sol`.
- Deployment flow is defined in `packages/contracts/scripts/deploy.ts`.
- Hardhat network configuration is in `packages/contracts/hardhat.config.ts`.
- Contract tests live in `packages/contracts/test/LogRegistry.ts`.
- No backend adapter currently calls the contract package from `apps/server`.

## Auth And Access Control
- No application-level auth provider was found in `apps/server`, `apps/web`, or `apps/agent`.
- No JWT, OAuth, session, or identity-provider integration was found.
- The only explicit authorization layer is contract-side role control using `AccessControl` in `packages/contracts/contracts/LogRegistry.sol`.

## External Services Not Yet Present
- No webhook receivers or emitters were found.
- No cloud storage, email, payments, or message queue integrations were found.
- No managed database service configuration was found.
- No analytics or monitoring SaaS integration was found.

## Integration Drift To Watch
- `apps/agent/.env.example` uses `SERVER_BASE_URL=http://127.0.0.1:3010`.
- `apps/server/.env.example` uses `PORT=3001`.
- That default port mismatch should be resolved before assuming local end-to-end startup works out of the box.
- Planned flow in `PROJECT_STRUCTURE.md` includes backend-to-blockchain integration, but the implementation is not there yet.
