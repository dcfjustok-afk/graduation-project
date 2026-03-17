# Repository Structure

## Top-Level Layout

```text
graduation-project/
|- .github/                 # GitHub-side skill/prompts for OpenSpec workflows
|- .planning/codebase/      # Generated repository-mapping documents
|- apps/                    # Executable applications
|- doc/                     # Graduation paperwork and supporting documents
|- openspec/                # Spec-driven change-management workspace
|- packages/                # Reusable packages and blockchain module
|- scripts/                 # Repository-level scripts placeholder
|- storage/                 # Runtime data and SQLite storage area
|- tests/                   # Cross-cutting test areas, currently placeholders
|- DEVELOPMENT_ROADMAP.md   # Stage-by-stage delivery plan
|- PROJECT_STRUCTURE.md     # Intended monorepo design reference
|- README.md                # Minimal repository description
|- package.json             # Root metadata only, not a real workspace orchestrator
```

## Application Directories

### `apps/web`
- Purpose: React/Vite frontend prototype for the audit dashboard.
- Package entry: `apps/web/package.json`.
- Tooling/config: `apps/web/vite.config.ts`, `apps/web/tsconfig.json`, `apps/web/index.html`.
- Runtime entry files: `apps/web/src/main.tsx`, `apps/web/src/App.tsx`.
- Route shell: `apps/web/src/router/index.tsx`, `apps/web/src/layouts/MainLayout.tsx`.
- Pages: `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/LogsPage.tsx`, `apps/web/src/pages/AuditPage.tsx`, `apps/web/src/pages/AlertsPage.tsx`.
- Data and API placeholders: `apps/web/src/mock/data.ts`, `apps/web/src/mock/index.ts`, `apps/web/src/api/mockClient.ts`.
- Shared UI/types: `apps/web/src/components/MetricCard.tsx`, `apps/web/src/components/SectionHeader.tsx`, `apps/web/src/types/index.ts`.
- Styling: `apps/web/src/styles/index.css`.
- Notable empty directories: `apps/web/public`, `apps/web/src/assets`, `apps/web/src/utils`.
- Generated/local-only directories already present: `apps/web/dist`, `apps/web/node_modules`.

### `apps/server`
- Purpose: Express + TypeScript backend API with SQLite persistence.
- Package entry: `apps/server/package.json`.
- Environment/config: `apps/server/.env.example`, `apps/server/tsconfig.json`, `apps/server/src/config/env.ts`.
- Bootstrap: `apps/server/src/index.ts`, `apps/server/src/app.ts`.
- Route layer: `apps/server/src/routes/index.ts`, `apps/server/src/routes/healthRoutes.ts`, `apps/server/src/routes/logRoutes.ts`, `apps/server/src/routes/overviewRoutes.ts`, `apps/server/src/routes/auditRoutes.ts`, `apps/server/src/routes/alertRoutes.ts`.
- Controller layer: `apps/server/src/controllers/healthController.ts`, `apps/server/src/controllers/logController.ts`, `apps/server/src/controllers/overviewController.ts`, `apps/server/src/controllers/auditController.ts`, `apps/server/src/controllers/alertController.ts`.
- Service layer: `apps/server/src/services/healthService.ts`, `apps/server/src/services/logService.ts`, `apps/server/src/services/overviewService.ts`, `apps/server/src/services/auditService.ts`, `apps/server/src/services/alertService.ts`.
- Repository layer: `apps/server/src/repositories/logRepository.ts`, `apps/server/src/repositories/overviewRepository.ts`, `apps/server/src/repositories/auditRepository.ts`, `apps/server/src/repositories/alertRepository.ts`.
- Database layer: `apps/server/src/db/sqliteClient.ts`, `apps/server/src/db/schema.ts`, `apps/server/src/db/initDatabase.ts`, `apps/server/src/db/verifyDatabase.ts`, `apps/server/src/db/databaseHealth.ts`, `apps/server/src/db/queryHelpers.ts`.
- Middleware/utilities: `apps/server/src/middleware/errorHandler.ts`, `apps/server/src/middleware/notFoundHandler.ts`, `apps/server/src/utils/apiResponse.ts`, `apps/server/src/types/sqljs.d.ts`.
- CLI scripts: `apps/server/src/scripts/initDatabase.ts`, `apps/server/src/scripts/verifyDatabase.ts`, `apps/server/src/scripts/seedDemoData.ts`.

### `apps/agent`
- Purpose: local log-collection agent that polls a file and submits new lines to the backend.
- Package entry: `apps/agent/package.json`.
- Environment/config: `apps/agent/.env.example`, `apps/agent/tsconfig.json`, `apps/agent/src/config/env.ts`.
- Bootstrap: `apps/agent/src/index.ts`.
- Orchestration: `apps/agent/src/agent/logAgent.ts`.
- Collection path: `apps/agent/src/collector/fileReader.ts`, `apps/agent/src/collector/logCollector.ts`.
- Delivery/retry path: `apps/agent/src/http/logApiClient.ts`, `apps/agent/src/retry/retryQueue.ts`.
- Local persistence/types: `apps/agent/src/state/offsetStore.ts`, `apps/agent/src/types/agent.ts`.
- Utilities: `apps/agent/src/utils/fsHelpers.ts`, `apps/agent/src/utils/logger.ts`.
- Demo helper: `apps/agent/scripts/append-demo-log.js`.
- Runtime directories are implied by config and docs rather than committed structure: logs under paths like `apps/agent/logs/demo-agent.log` and agent state under paths like `apps/agent/state/agent-state.json`.

## Package Directories

### `packages/contracts`
- Purpose: Hardhat-based smart-contract package for log anchoring.
- Package entry: `packages/contracts/package.json`.
- Tooling/config: `packages/contracts/hardhat.config.ts`, `packages/contracts/tsconfig.json`, `packages/contracts/.env.example`, `packages/contracts/.gitignore`.
- Contract source: `packages/contracts/contracts/LogRegistry.sol`.
- Deployment script: `packages/contracts/scripts/deploy.ts`.
- Tests: `packages/contracts/test/LogRegistry.ts`.
- Ignored/generated areas are expected but not committed: `packages/contracts/artifacts`, `packages/contracts/cache`, `packages/contracts/typechain-types`.

### `packages/shared`
- Current state: placeholder only.
- Present file: `packages/shared/README.md`.
- Intended role from docs: shared types, request/response schemas, constants, and validation helpers for `apps/web`, `apps/server`, and `apps/agent`.

## Support Directories

### `storage`
- Purpose: repository-level runtime data storage.
- Guide file: `storage/README.md`.
- SQLite area: `storage/sqlite/README.md`.
- Actual backend DB path resolves here from `apps/server/src/config/env.ts` as `storage/sqlite/graduation-project.db` when initialized.

### `tests`
- Purpose: cross-application testing and experiment space.
- Guide files: `tests/README.md`, `tests/performance/README.md`.
- Current state: documentation placeholders only; there are no committed executable performance scripts yet.

### `scripts`
- Purpose: planned repository-level helper scripts.
- Current state: only `scripts/README.md` exists; no repo-wide automation scripts are implemented yet.

### `doc`
- Purpose: graduation-design paperwork and reference material.
- Files include `doc/README.md`, `doc/221310610_任务书_开题报告.txt`, `doc/221310610_任务书_开题报告.doc`, and `doc/221310610_戴驰峰_任务书.doc`.

### `openspec`
- Purpose: spec-driven workflow support.
- Config file: `openspec/config.yaml`.
- Workspace folders: `openspec/changes/`, `openspec/specs/`.
- Current state: `openspec/specs/` is empty, and `openspec/changes/` only contains `openspec/changes/archive/`.

### `.github/skills`
- Purpose: repository-local skill documents for OpenSpec-oriented prompting.
- Present subdirectories: `.github/skills/openspec-apply-change/`, `.github/skills/openspec-archive-change/`, `.github/skills/openspec-explore/`, `.github/skills/openspec-propose/`.

### `.planning/codebase`
- Purpose: generated codebase mapping output.
- Files written by this task: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Structural Patterns Worth Knowing
- The repository follows a monorepo naming pattern, but package management is still per-project rather than workspace-managed; each app/package has its own `package.json` and lockfile.
- Source directories are cleanly segmented by responsibility in `apps/server/src/` and `apps/agent/src/`, which makes those two applications easy to navigate by layer.
- The frontend structure is feature-lite and page-centric: one router, a single layout, a small component set, and mock data colocated in `apps/web/src/mock/`.
- Repository root documents describe a larger target structure than what is currently committed, so some directories in `PROJECT_STRUCTURE.md` exist only as planned architecture, not real code.

## Gaps Between Planned and Actual Structure
- `PROJECT_STRUCTURE.md` describes a richer `apps/web/src/` layout with hooks, store, charts, and page subfolders, but the real code currently uses only `api`, `components`, `layouts`, `mock`, `pages`, `router`, `styles`, `types`, and empty `assets`/`utils` directories.
- `PROJECT_STRUCTURE.md` and `apps/server/README.md` mention a `blockchain` directory in `apps/server/src/`, but no such directory exists yet.
- The roadmap expects shared code in `packages/shared/`, performance scripts in `tests/performance/`, and repo-level helpers in `scripts/`, but those areas remain documentation stubs.
- The top-level design references broader workspace coordination, but the root `package.json` still only contains placeholder metadata and a default failing `test` script.

## Fast Navigation Guide
- Start with `apps/server/src/` if you want the current live business logic.
- Start with `apps/agent/src/` if you want the working ingestion loop.
- Start with `apps/web/src/pages/` if you want the current user-facing prototype.
- Start with `packages/contracts/contracts/LogRegistry.sol` if you want the chain-side model.
- Start with `PROJECT_STRUCTURE.md` and `DEVELOPMENT_ROADMAP.md` if you want the intended future shape rather than the currently implemented one.
