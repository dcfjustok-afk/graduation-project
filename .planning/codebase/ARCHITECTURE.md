# Codebase Architecture

## System Shape
- The repository is organized like a monorepo with separate applications in `apps/` and packages in `packages/`.
- The current real system is a partial implementation of a trusted log auditing platform.
- The best-supported closed loop today is `apps/agent` -> `apps/server` -> SQLite storage.

## Main Subsystems
- `apps/agent`: local log collection, incremental reading, retry handling, and state persistence.
- `apps/server`: API layer, storage access, summary endpoints, and system health reporting.
- `apps/web`: dashboard and audit UI prototype with mock-backed pages.
- `packages/contracts`: log-hash anchoring contract and local deployment/testing workflow.
- `packages/shared`: planned shared protocol layer, currently still a placeholder.

## Runtime Data Flow
- Agent starts from `apps/agent/src/index.ts`.
- Collection orchestration happens in `apps/agent/src/agent/logAgent.ts`.
- File reading is handled in `apps/agent/src/collector/fileReader.ts` and `apps/agent/src/collector/logCollector.ts`.
- HTTP submission happens through `apps/agent/src/http/logApiClient.ts`.
- Server boots from `apps/server/src/index.ts` and `apps/server/src/app.ts`.
- Requests are routed through `apps/server/src/routes/index.ts` into controllers, services, and repositories.
- Data is persisted by repository code such as `apps/server/src/repositories/logRepository.ts`.
- Database schema is created in `apps/server/src/db/schema.ts`.

## Layering Pattern
- Server uses a conventional layered structure: routes -> controllers -> services -> repositories -> db.
- Example path: `apps/server/src/routes/logRoutes.ts` -> `apps/server/src/controllers/logController.ts` -> `apps/server/src/services/logService.ts` -> `apps/server/src/repositories/logRepository.ts`.
- Error shaping is centralized through middleware in `apps/server/src/middleware/errorHandler.ts` and `apps/server/src/middleware/notFoundHandler.ts`.
- API response formatting is centralized in `apps/server/src/utils/apiResponse.ts`.

## Frontend Architecture
- Frontend entry point is `apps/web/src/main.tsx`.
- App shell is assembled in `apps/web/src/App.tsx` and `apps/web/src/layouts/MainLayout.tsx`.
- Routing is centralized in `apps/web/src/router/index.tsx`.
- Pages are organized by user-facing workflow in `apps/web/src/pages/`.
- Current data architecture is mock-first rather than API-first, centered on `apps/web/src/api/mockClient.ts` and `apps/web/src/mock/data.ts`.

## Contract Architecture
- The contract package is independently structured around `packages/contracts/contracts/LogRegistry.sol`.
- Deployment scripts live in `packages/contracts/scripts/`.
- Contract tests live in `packages/contracts/test/`.
- Access policy is enforced inside the contract through `LOGGER_ROLE` and OpenZeppelin `AccessControl`.

## Architectural Boundaries
- Agent owns collection and delivery, not query or visualization.
- Server owns API access, persistence, and aggregation, not local file monitoring.
- Web owns presentation and navigation, not authoritative data processing.
- Contracts own on-chain integrity records, not off-chain storage or UI logic.
- Shared package is intended to own cross-app schemas and types, but that role is not implemented yet.

## Planned Vs Current Architecture
- `PROJECT_STRUCTURE.md` describes a fuller architecture including backend blockchain adapters and shared schemas.
- Current implementation only partially matches that plan.
- The database already has audit-related tables in `apps/server/src/db/schema.ts`, but audit execution and alert generation are still thin.
- Health reporting in `apps/server/src/services/healthService.ts` still marks blockchain status as pending.

## Architectural Assessment
- Strongest architectural area: clear package/app separation.
- Strongest implemented runtime path: ingestion from Agent into Server and SQLite.
- Largest missing architectural join: connecting Server to `packages/contracts`.
- Largest cross-cutting gap: no real shared contracts/types layer in `packages/shared`.
