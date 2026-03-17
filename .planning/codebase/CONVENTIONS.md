# Codebase Conventions

## Naming
- Types, interfaces, and React components generally use PascalCase, such as `ApiResponse`, `DashboardData`, and `DashboardPage`.
- Functions and variables generally use camelCase, such as `createApp`, `submitLogController`, and `getDashboardData`.
- Backend and agent file names are mostly responsibility-based camelCase names.
- Frontend component and page files use PascalCase names like `MainLayout.tsx` and `AuditPage.tsx`.

## App-Level Structural Conventions
- Server follows layered backend organization: routes, controllers, services, repositories, db, middleware, and utils.
- Web follows UI-oriented organization: pages, layouts, components, api, mock, router, and types.
- Agent follows process-oriented organization: agent, collector, http, retry, state, config, utils, and types.
- Contracts keep Solidity, deployment scripts, and tests separated within the Hardhat standard layout.

## TypeScript Conventions
- Strict mode is enabled in all TypeScript subprojects.
- Interfaces and typed payloads are used heavily in `apps/server/src/repositories/logRepository.ts`, `apps/agent/src/types/agent.ts`, and `apps/web/src/types/index.ts`.
- The frontend uses `import type` style for type-only imports in places like `apps/web/src/api/mockClient.ts`.
- A local declaration file is used for `sql.js` typing in `apps/server/src/types/sqljs.d.ts`.

## Error Handling Conventions
- Server centralizes 404 and error responses through `apps/server/src/middleware/notFoundHandler.ts` and `apps/server/src/middleware/errorHandler.ts`.
- Shared API response shaping is done in `apps/server/src/utils/apiResponse.ts`.
- Controllers usually perform minimal presence checks before delegating to services, as seen in `apps/server/src/controllers/logController.ts`.
- Agent code uses localized `try/catch` plus retry behavior in `apps/agent/src/retry/retryQueue.ts` and `apps/agent/src/agent/logAgent.ts`.

## Config Conventions
- Environment loading is centralized per app through `dotenv` and `config/env.ts` modules.
- Example env files exist in `apps/server/.env.example`, `apps/agent/.env.example`, and `packages/contracts/.env.example`.
- Contracts rely on `packages/contracts/hardhat.config.ts` for network and toolchain configuration.
- Defaults are embedded in code where required, which helps bootstrapping but can hide integration drift.

## Formatting Reality
- Style is not fully standardized across subprojects.
- `apps/server`, `apps/agent`, and `packages/contracts` mostly use double quotes.
- `apps/web` mostly uses single quotes.
- No repo-wide ESLint, Prettier, or Biome configuration was found.

## Data Model Conventions
- Database tables and columns use snake_case in `apps/server/src/db/schema.ts`.
- TypeScript payloads and objects generally use camelCase in controllers and clients.
- This split is consistent enough to read, but shared DTOs are still missing.

## Practical Implications
- Conventions are strongest inside each app, but not yet unified across the repository.
- The repo would benefit from shared linting, formatting, DTO validation, and cross-package type reuse.
- The current structure is still understandable because naming is descriptive and layer boundaries are visible.
- `packages/shared` is the obvious future home for stronger repo-wide conventions.
