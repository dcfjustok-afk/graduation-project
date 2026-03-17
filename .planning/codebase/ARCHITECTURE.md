# Repository Architecture

## System Shape
- The repository is a monorepo centered on a graduation-project implementation for a trusted task log auditing system, with executable apps under `apps/`, reusable modules under `packages/`, local runtime state under `storage/`, and planning/spec material under `openspec/` and top-level Markdown files.
- The implemented runtime currently has four concrete layers: the React frontend in `apps/web`, the Express + SQLite backend in `apps/server`, the file-polling log agent in `apps/agent`, and the Hardhat smart-contract package in `packages/contracts`.
- The intended business flow described across `PROJECT_STRUCTURE.md`, `DEVELOPMENT_ROADMAP.md`, and the code is: local log file -> agent collection -> backend persistence -> blockchain hash anchoring -> audit/alert presentation.
- The current delivered codebase has the first half of that flow running end-to-end: `apps/agent` can submit logs to `apps/server`, and `apps/server` persists them to SQLite; `packages/contracts` exists and is testable, but backend-to-contract integration is still a planned extension.

## Runtime Components

### Frontend: audit dashboard prototype
- Entry point: `apps/web/src/main.tsx` mounts `apps/web/src/App.tsx` into `apps/web/index.html`.
- Shell and routing: `apps/web/src/router/index.tsx` defines four routes rendered through `apps/web/src/layouts/MainLayout.tsx`.
- Page modules: `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/LogsPage.tsx`, `apps/web/src/pages/AuditPage.tsx`, and `apps/web/src/pages/AlertsPage.tsx` implement the current UI surface.
- Data source model: `apps/web/src/api/mockClient.ts` reads from `apps/web/src/mock/data.ts`, so the frontend is still a mock-driven prototype rather than an API-driven client.
- Shared UI contracts: `apps/web/src/types/index.ts`, `apps/web/src/components/MetricCard.tsx`, and `apps/web/src/components/SectionHeader.tsx` define the page-facing data shapes and reusable presentation pieces.
- Styling is centralized in `apps/web/src/styles/index.css`; `apps/web/package.json` shows a Vite + React + TypeScript + Ant Design stack.

### Backend: layered HTTP API over SQLite
- Bootstrap path: `apps/server/src/index.ts` initializes the database first, then starts the Express app assembled in `apps/server/src/app.ts`.
- Configuration is centralized in `apps/server/src/config/env.ts`, including the SQLite file path `../../storage/sqlite/graduation-project.db`.
- Routing is aggregated in `apps/server/src/routes/index.ts`, which mounts feature routers from `apps/server/src/routes/healthRoutes.ts`, `apps/server/src/routes/logRoutes.ts`, `apps/server/src/routes/overviewRoutes.ts`, `apps/server/src/routes/auditRoutes.ts`, and `apps/server/src/routes/alertRoutes.ts`.
- Controllers in `apps/server/src/controllers/` are thin HTTP adapters; service files in `apps/server/src/services/` mostly delegate to repositories, preserving a clean layered architecture for later expansion.
- Repositories in `apps/server/src/repositories/` own SQL interactions, with `apps/server/src/repositories/logRepository.ts` carrying the only write path used by the live agent flow.
- Shared API response shaping is handled by `apps/server/src/utils/apiResponse.ts`, while `apps/server/src/middleware/errorHandler.ts` and `apps/server/src/middleware/notFoundHandler.ts` normalize error responses.

### Data layer: embedded SQLite via sql.js
- Database access is encapsulated in `apps/server/src/db/sqliteClient.ts`, which opens a file-backed sql.js database and writes changes back to disk.
- Schema definition lives in `apps/server/src/db/schema.ts`; it creates five core tables: `logs`, `log_hash_records`, `audit_records`, `alerts`, and `agent_states`.
- Initialization and verification are separated into `apps/server/src/db/initDatabase.ts` and `apps/server/src/db/verifyDatabase.ts`, with CLI wrappers in `apps/server/src/scripts/initDatabase.ts` and `apps/server/src/scripts/verifyDatabase.ts`.
- Health reporting uses `apps/server/src/db/databaseHealth.ts`, which currently treats file existence as the minimum database readiness signal.
- Query result shaping and SQL escaping helpers live in `apps/server/src/db/queryHelpers.ts`.
- Storage location is repository-level rather than app-local: `storage/sqlite/` is the persistent data boundary for backend runtime state.

### Agent: polling collector with local retry state
- Bootstrap path: `apps/agent/src/index.ts` starts the agent produced by `apps/agent/src/agent/logAgent.ts`.
- Runtime configuration comes from `apps/agent/src/config/env.ts`, including the watched file path, state-file path, backend base URL, polling interval, and retry policy.
- Collection is split into `apps/agent/src/collector/fileReader.ts` for offset-based incremental reading and `apps/agent/src/collector/logCollector.ts` for queue-item creation.
- Durable local state is stored through `apps/agent/src/state/offsetStore.ts`; this persists last offset, heartbeat timestamps, and the pending retry queue to a JSON file.
- HTTP delivery is isolated in `apps/agent/src/http/logApiClient.ts`, which posts both logs and agent state back to the backend.
- Retry orchestration sits in `apps/agent/src/retry/retryQueue.ts`, which replays pending items and updates backend-visible agent status.

### Blockchain package: standalone contract subsystem
- Smart-contract source is `packages/contracts/contracts/LogRegistry.sol`.
- Local contract tooling is configured in `packages/contracts/hardhat.config.ts` with deployment in `packages/contracts/scripts/deploy.ts` and tests in `packages/contracts/test/LogRegistry.ts`.
- The contract uses OpenZeppelin `AccessControl` to gate write operations and stores a hash-oriented record model keyed by task ID and record index.
- `packages/contracts/package.json` shows this package is intentionally standalone from the Node server; there is no current import or RPC client bridge from `apps/server` into `packages/contracts`.

## Implemented Data Flow
1. The agent watches a local file configured by `apps/agent/src/config/env.ts`.
2. `apps/agent/src/collector/fileReader.ts` reads only appended bytes after the last known offset.
3. `apps/agent/src/collector/logCollector.ts` converts new lines into queue records and persists them through `apps/agent/src/state/offsetStore.ts`.
4. `apps/agent/src/retry/retryQueue.ts` posts each queued log to `POST /api/logs` and posts agent heartbeat/state to `POST /api/agents/state`.
5. `apps/server/src/controllers/logController.ts` validates minimum fields, then delegates to `apps/server/src/services/logService.ts`.
6. `apps/server/src/repositories/logRepository.ts` inserts rows into `logs` and upserts rows into `agent_states`.
7. The database file under `storage/sqlite/` becomes the source of truth for backend state.
8. Read APIs in `apps/server/src/routes/overviewRoutes.ts`, `apps/server/src/routes/auditRoutes.ts`, and `apps/server/src/routes/alertRoutes.ts` expose future dashboard data, although the frontend does not consume them yet.

## Architectural Boundaries

### Strong boundaries already present
- `apps/server` follows `routes -> controllers -> services -> repositories -> db`, which makes responsibilities easy to explain and extend.
- `apps/agent` cleanly separates polling, reading, queue persistence, HTTP submission, and logging.
- `packages/contracts` is isolated enough to compile and test independently.
- Persistent runtime artifacts are kept outside app folders in `storage/`, avoiding accidental coupling to build outputs.

### Weak or unfinished boundaries
- The frontend has no real API client abstraction beyond `apps/web/src/api/mockClient.ts`; backend contracts are not yet mirrored in `apps/web/src/types/index.ts`.
- `packages/shared/` exists only as `packages/shared/README.md`, so there is not yet a shared schema/type package spanning web, server, and agent.
- `apps/server/src/repositories/logRepository.ts` builds SQL with string interpolation plus manual escaping; it works for this stage, but it is a fragile data-access boundary.
- There is no `blockchain/` directory inside `apps/server/src/`, even though `apps/server/README.md` and `PROJECT_STRUCTURE.md` treat that integration as a near-term architectural slot.
- The repo root `package.json` is not a real workspace orchestrator yet; each application/package is managed independently.

## Current Integration Status
- `apps/web` is production-buildable but functionally decoupled from live backend data.
- `apps/server` and `apps/agent` form the only active cross-application runtime integration today.
- `packages/contracts` is implemented and testable in isolation, but not wired into backend write flows or frontend read flows.
- `tests/performance/` and `packages/shared/` are placeholders, signaling intended architecture that is not yet realized.
- `openspec/` is present for specification workflow, but `openspec/specs/` is empty and `openspec/changes/` only contains an archive directory, so it is not currently driving implementation.

## Non-runtime Repository Support Areas
- Planning/reference docs: `README.md`, `PROJECT_STRUCTURE.md`, and `DEVELOPMENT_ROADMAP.md` explain the target monorepo shape and staged delivery plan.
- Graduation materials live under `doc/`, including `doc/221310610_任务书_开题报告.txt` and related `.doc` files.
- GitHub prompt skills live in `.github/skills/`, including `.github/skills/openspec-explore/SKILL.md` and related OpenSpec helpers.
- Generated frontend artifacts already exist in `apps/web/dist/`, which indicates the frontend has been built locally.

## Practical Reading Order
1. Read `PROJECT_STRUCTURE.md` for intended architecture.
2. Read `apps/server/src/index.ts` and `apps/server/src/app.ts` for the backend entry path.
3. Read `apps/server/src/repositories/logRepository.ts` and `apps/server/src/db/schema.ts` for the current data model.
4. Read `apps/agent/src/agent/logAgent.ts` and `apps/agent/src/retry/retryQueue.ts` for the live ingestion workflow.
5. Read `apps/web/src/router/index.tsx` and the files under `apps/web/src/pages/` for the current UI surface.
6. Read `packages/contracts/contracts/LogRegistry.sol` for the blockchain-side design that the backend is expected to integrate next.
