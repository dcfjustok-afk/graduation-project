# Codebase Structure

## Top-Level Layout
- `apps/` contains runnable application code.
- `packages/` contains reusable or independently deployable packages.
- `storage/` contains persisted runtime data.
- `tests/` is reserved for broader testing such as performance work.
- `scripts/` is reserved for repo-level automation.
- Planning and reference docs include `README.md`, `PROJECT_STRUCTURE.md`, and `DEVELOPMENT_ROADMAP.md`.

## Apps Directory
- `apps/web`: React frontend prototype.
- `apps/server`: Express backend service.
- `apps/agent`: local log collection agent.

## Packages Directory
- `packages/contracts`: Hardhat contract package.
- `packages/shared`: placeholder for future shared schemas, constants, and types.

## Server Structure
- Entry points: `apps/server/src/index.ts`, `apps/server/src/app.ts`.
- Config: `apps/server/src/config/`.
- Routes: `apps/server/src/routes/`.
- Controllers: `apps/server/src/controllers/`.
- Services: `apps/server/src/services/`.
- Repositories: `apps/server/src/repositories/`.
- Database utilities and schema: `apps/server/src/db/`.
- Middleware: `apps/server/src/middleware/`.
- Utility helpers: `apps/server/src/utils/`.
- One local type shim exists at `apps/server/src/types/sqljs.d.ts`.

## Agent Structure
- Entry point: `apps/agent/src/index.ts`.
- Main orchestration: `apps/agent/src/agent/`.
- Log collection: `apps/agent/src/collector/`.
- HTTP delivery: `apps/agent/src/http/`.
- Retry queue logic: `apps/agent/src/retry/`.
- Offset and local state: `apps/agent/src/state/`.
- Config and utilities: `apps/agent/src/config/`, `apps/agent/src/utils/`.
- Domain types: `apps/agent/src/types/`.

## Web Structure
- Entry point: `apps/web/src/main.tsx`.
- App shell: `apps/web/src/App.tsx`.
- Router: `apps/web/src/router/`.
- Layouts: `apps/web/src/layouts/`.
- Pages: `apps/web/src/pages/`.
- Components: `apps/web/src/components/`.
- API layer: `apps/web/src/api/`.
- Mock data layer: `apps/web/src/mock/`.
- Shared frontend types: `apps/web/src/types/index.ts`.

## Contracts Structure
- Contracts: `packages/contracts/contracts/`.
- Deployment scripts: `packages/contracts/scripts/`.
- Tests: `packages/contracts/test/`.
- Tooling config: `packages/contracts/hardhat.config.ts`.

## Runtime Data And Supporting Areas
- SQLite artifacts live under `storage/sqlite/`.
- Performance testing placeholder lives under `tests/performance/`.
- Repo-level script placeholder lives under `scripts/`.

## Naming And Organization Patterns
- Backend file naming is responsibility-based, such as `logRoutes.ts`, `logController.ts`, `logService.ts`, `logRepository.ts`.
- Frontend page files use PascalCase names like `DashboardPage.tsx` and `LogsPage.tsx`.
- Agent directories are capability-based: `collector`, `http`, `retry`, `state`.
- Config is generally centralized per app in `config/env.ts` or package-level config files.

## Notable Drift From Planned Structure
- `PROJECT_STRUCTURE.md` describes directories that do not yet exist, such as `apps/server/src/blockchain`, `apps/server/src/validators`, and `packages/shared/src`.
- The agent plan mentions `collectors`, `watchers`, `reporters`, and `queue`, while current code uses `collector`, `http`, and `retry`.
- Root workspace tooling has not been implemented even though the layout suggests a unified monorepo.
