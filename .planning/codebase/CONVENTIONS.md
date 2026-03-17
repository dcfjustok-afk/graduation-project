# Codebase Conventions

## Repository shape
- The repo is organized by runnable apps under `apps/` and shared package work under `packages/`, with future test and script expansion documented in `tests/README.md`, `tests/performance/README.md`, and `scripts/README.md`.
- Current implementation is concentrated in `apps/server`, `apps/agent`, `apps/web`, and `packages/contracts`; `packages/shared` is a planned location rather than an active code package.
- Backend and agent code follow layered folders such as `src/config`, `src/routes`, `src/controllers`, `src/services`, `src/repositories`, `src/db`, and `src/utils` as described in `apps/server/README.md` and `apps/agent/README.md`.

## Languages and tooling
- TypeScript is the default language for `apps/server`, `apps/agent`, `apps/web`, and Hardhat tests/config in `packages/contracts`.
- Solidity is isolated to `packages/contracts/contracts/LogRegistry.sol`.
- All TypeScript projects enable strict mode in `apps/server/tsconfig.json`, `apps/agent/tsconfig.json`, `apps/web/tsconfig.json`, and `packages/contracts/tsconfig.json`.
- Node targets are modern: server and agent require Node 18+ in `apps/server/package.json` and `apps/agent/package.json`; the agent relies on built-in `fetch` in `apps/agent/src/http/logApiClient.ts`.

## Naming and file organization
- File names are mostly camelCase in server and agent code, for example `apps/server/src/services/healthService.ts` and `apps/agent/src/retry/retryQueue.ts`.
- React components and page files use PascalCase, for example `apps/web/src/layouts/MainLayout.tsx`, `apps/web/src/pages/DashboardPage.tsx`, and `apps/web/src/components/MetricCard.tsx`.
- Routes, controllers, services, and repositories are named by domain and role, such as `apps/server/src/routes/logRoutes.ts` -> `apps/server/src/controllers/logController.ts` -> `apps/server/src/services/logService.ts` -> `apps/server/src/repositories/logRepository.ts`.
- Interfaces and types use PascalCase with descriptive suffixes like `ApiResponse`, `PendingLogRecord`, `OverviewStats`, `AlertEntity`, and `AuditRecordEntity` in `apps/server/src/utils/apiResponse.ts`, `apps/agent/src/types/agent.ts`, and repository files.

## Layering patterns
- Server request flow is intentionally thin and linear: routes register handlers, controllers validate/request-shape, services orchestrate, repositories talk to SQLite. Good examples are `apps/server/src/routes/logRoutes.ts`, `apps/server/src/controllers/logController.ts`, `apps/server/src/services/logService.ts`, and `apps/server/src/repositories/logRepository.ts`.
- Many services are pass-through wrappers today, for example `apps/server/src/services/alertService.ts`, `apps/server/src/services/auditService.ts`, and `apps/server/src/services/overviewService.ts`; preserve that separation even if logic is currently minimal.
- App bootstrap code stays small and delegates setup, shown by `apps/server/src/index.ts` calling `initializeDatabase()` and `createApp()`, and `apps/agent/src/index.ts` calling `createLogAgent()`.
- Environment access is centralized in config modules rather than scattered reads from `process.env`, as in `apps/server/src/config/env.ts` and `apps/agent/src/config/env.ts`.

## Data and API conventions
- Server responses use a shared envelope with `success`, `message`, and `data`, plus `meta.total` for lists, defined in `apps/server/src/utils/apiResponse.ts`.
- Controllers usually return explicit status codes with helper builders, for example `createSuccessResponse`, `createErrorResponse`, and `createListResponse` in `apps/server/src/controllers/healthController.ts`, `apps/server/src/controllers/logController.ts`, and `apps/server/src/controllers/alertController.ts`.
- Repository entities mirror database column names using snake_case fields, such as `task_id`, `created_at`, and `last_heartbeat_at` in `apps/server/src/repositories/logRepository.ts` and `apps/server/src/repositories/auditRepository.ts`.
- Service and client payloads use camelCase TypeScript objects, then map into database or API shapes, for example `CreateLogPayload` in `apps/server/src/repositories/logRepository.ts` and `LogSubmitPayload` in `apps/agent/src/types/agent.ts`.

## Style conventions actually present
- `apps/server` and `apps/agent` use double quotes and semicolons consistently, visible in files like `apps/server/src/app.ts` and `apps/agent/src/agent/logAgent.ts`.
- `apps/web` uses single quotes and semicolons consistently, visible in `apps/web/src/main.tsx`, `apps/web/src/router/index.tsx`, and `apps/web/src/pages/LogsPage.tsx`.
- There is no repo-wide formatter or linter configuration in the current codebase, so preserve the local style of the area you edit instead of normalizing across apps.
- Indentation is two spaces in TypeScript/TSX and four spaces in Solidity, as seen in `apps/web/src/App.tsx` and `packages/contracts/contracts/LogRegistry.sol`.

## Documentation and comments
- Server, agent, and Solidity files often include explanatory comments aimed at readability and thesis/demo context rather than terse implementation notes, for example `apps/server/src/app.ts`, `apps/server/src/db/sqliteClient.ts`, `apps/agent/src/config/env.ts`, and `packages/contracts/contracts/LogRegistry.sol`.
- Comments usually explain responsibility boundaries, extension points, and design rationale; short obvious functions in the web app are often left uncommented.
- README files are used to document module intent, current completion, and run commands, for example `apps/server/README.md`, `apps/agent/README.md`, `apps/web/README.md`, and `packages/contracts/README.md`.

## Error handling and runtime behavior
- Startup scripts and entrypoints log a scoped prefix and exit on fatal errors, as in `apps/server/src/index.ts`, `apps/server/src/scripts/initDatabase.ts`, `apps/server/src/scripts/verifyDatabase.ts`, `apps/server/src/scripts/seedDemoData.ts`, and `apps/agent/src/index.ts`.
- Express middleware standardizes not-found and server-failure responses in `apps/server/src/middleware/notFoundHandler.ts` and `apps/server/src/middleware/errorHandler.ts`.
- Agent logging is wrapped in small helpers with a consistent `[agent]` prefix in `apps/agent/src/utils/logger.ts`.

## Frontend conventions
- The web app is componentized around pages, layout, reusable sections, and typed mock data in `apps/web/src/pages`, `apps/web/src/layouts`, `apps/web/src/components`, `apps/web/src/mock`, and `apps/web/src/types/index.ts`.
- Data fetching is currently abstracted behind async mock client functions in `apps/web/src/api/mockClient.ts` so pages can later swap mock data for real API calls with minimal page changes.
- Styling is centralized in one global stylesheet, `apps/web/src/styles/index.css`, with semantic class names such as `app-shell`, `panel-card`, `hero-card`, and `status-pill`.
- Ant Design is customized through `ConfigProvider` in `apps/web/src/App.tsx` rather than per-component theming.

## Practical guidance for future edits
- Match the local quote style and naming of the subproject you touch; do not reformat `apps/web` to server style or vice versa.
- Keep controller logic small and move persistence details into repositories, following `apps/server/src/controllers/logController.ts` and `apps/server/src/repositories/logRepository.ts`.
- Add new environment variables to the relevant config module and `.env.example`, not directly in entrypoints; see `apps/server/src/config/env.ts`, `apps/agent/src/config/env.ts`, `apps/server/.env.example`, and `apps/agent/.env.example`.
- When adding new data models, keep database-facing shapes aligned with SQLite column naming in repository entities and expose API/client shapes separately in typed payloads.
