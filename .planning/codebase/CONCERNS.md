# Codebase Concerns

## Highest-priority issues
- The default local closed loop is broken: `apps/server/src/config/env.ts` and `apps/server/.env.example` default the API to port `3001`, while `apps/agent/src/config/env.ts` and `apps/agent/.env.example` default the agent target to `3010`, so the out-of-the-box Agent -> Server flow fails unless someone manually reconciles ports.
- The current server smoke test is not runnable from a clean checkout: `apps/server/package.json` defines `test` as `npm run db:init && npm run db:verify`, but both scripts execute `dist` files from `apps/server/src/scripts/initDatabase.ts` and `apps/server/src/scripts/verifyDatabase.ts` without a preceding build step.
- The trust model is weakened in the collector itself: `apps/agent/src/collector/fileReader.ts` trims every line and drops blank lines, which changes the original log payload before storage and makes later integrity claims weaker for a system centered on trustworthy log auditing.
- The persistence layer is fragile and hard to scale: `apps/server/src/repositories/logRepository.ts` builds SQL with string interpolation, while `apps/server/src/db/sqliteClient.ts` loads and rewrites the full SQLite file for every write through `sql.js`, creating security, performance, and concurrency concerns.

## Architecture drift and incomplete platform integration
- The repo is described as a monorepo in `PROJECT_STRUCTURE.md` and `DEVELOPMENT_ROADMAP.md`, but root orchestration is still missing: `package.json` has the default placeholder `test` script and there are no workspace definitions or repo-level build/test/dev commands.
- `packages/shared/README.md` documents shared contracts/types, but `packages/shared` has no implementation, so `apps/server`, `apps/agent`, and `apps/web` currently duplicate or invent their own shapes instead of sharing a single protocol source of truth.
- Blockchain integration is still largely aspirational from the server side: `packages/contracts/contracts/LogRegistry.sol` and `packages/contracts/scripts/deploy.ts` exist, but `apps/server/src` has no blockchain client layer, no contract artifact consumption, and no code writing to `log_hash_records` in `apps/server/src/db/schema.ts`.
- The frontend remains mock-first with no real runtime switch despite roadmap language in `DEVELOPMENT_ROADMAP.md`: pages call `apps/web/src/api/mockClient.ts` directly, and `apps/web/src/mock/data.ts` still describes backend and chain features as placeholders.

## Backend concerns
- Route coverage is broader than real business depth: `apps/server/src/routes/alertRoutes.ts`, `apps/server/src/routes/auditRoutes.ts`, and `apps/server/src/routes/overviewRoutes.ts` expose endpoints, but their paired services in `apps/server/src/services/*.ts` are pass-through wrappers over simple read queries with no audit execution, no alert generation, and no chain reconciliation.
- Request validation is minimal and hand-written in `apps/server/src/controllers/logController.ts`; there is no schema validation, no body size control, no authentication, no authorization, and no rate limiting anywhere in `apps/server/src/app.ts` or `apps/server/src/routes`.
- Foreign keys are declared in `apps/server/src/db/schema.ts`, but no connection code in `apps/server/src/db/sqliteClient.ts` enables `PRAGMA foreign_keys = ON`, so relational guarantees may not actually be enforced.
- The repository layer repeatedly opens separate database instances for simple work. `apps/server/src/repositories/overviewRepository.ts` runs six count queries in parallel, and each call opens and closes its own database via `apps/server/src/db/sqliteClient.ts`, multiplying I/O and making aggregate reads inefficient.
- `apps/server/src/middleware/errorHandler.ts` converts all uncaught failures into a generic `500`, so future domain errors, validation failures, and database issues cannot surface as structured application-level responses.
- Demo seeding is environment-specific: `apps/server/src/scripts/seedDemoData.ts` hard-codes Windows-style paths like `D:/demo/manual-seed.log`, which makes the sample data story drift from the actual macOS workspace and reduces portability.

## Agent concerns
- `apps/agent/src/collector/fileReader.ts` does not handle log rotation safely; when the file shrinks, it resets the offset to the smaller size and returns no lines, so newly rotated content can be skipped.
- `apps/agent/src/state/offsetStore.ts` trusts local state JSON completely and calls `JSON.parse` without recovery; one corrupted state file can stop the Agent at startup.
- `apps/agent/src/retry/retryQueue.ts` drops records after `maxRetryTimes` with only a console error. There is no dead-letter file, alert emission, or operator-visible failure record, so data can be lost silently from the system of record.
- The polling model in `apps/agent/src/agent/logAgent.ts` uses `setInterval` only, with no file watcher, shutdown handling, or backpressure controls, so long-running behavior is likely brittle under real workloads.
- `apps/agent/src/types/agent.ts` and `apps/server/src/repositories/logRepository.ts` define related payloads independently; without a shared package, schema drift between submission and persistence is likely as the project grows.

## Frontend concerns
- The web app is still bound to local mock data: `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/LogsPage.tsx`, `apps/web/src/pages/AuditPage.tsx`, and `apps/web/src/pages/AlertsPage.tsx` either call `apps/web/src/api/mockClient.ts` or import from `apps/web/src/mock`, so there is no true API integration seam yet.
- The current production bundle is already heavy for a small app. A build of `apps/web` reports a large output chunk, and `apps/web/src/router/index.tsx` does not use route-level lazy loading or other code splitting.
- Error and loading states are underdeveloped: pages such as `apps/web/src/pages/DashboardPage.tsx` and `apps/web/src/pages/AlertsPage.tsx` fire async requests in `useEffect` but do not handle rejections, retries, or visible loading feedback.
- Frontend types in `apps/web/src/types/index.ts` are presentation-specific and do not line up with backend response entities in `apps/server/src/repositories/*.ts`, which will make the eventual mock-to-real migration more expensive.
- The UI copy in `apps/web/src/mock/data.ts`, `apps/web/src/layouts/MainLayout.tsx`, and `apps/web/README.md` still describes major areas as prototype or placeholder work, which risks shipping demo language into the later integrated product.

## Smart contract and integration concerns
- `packages/contracts/scripts/deploy.ts` deploys with the same signer as both admin and logger, which is acceptable for a demo but not for a realistic least-privilege model.
- `packages/contracts/hardhat.config.ts` only defines `hardhat` and `localhost` networks, and `packages/contracts/.env.example` only includes `LOCALHOST_RPC_URL`; there is no clear path yet for staging/testnet deployment or for feeding deployed addresses back into `apps/server`.
- `packages/contracts/test/LogRegistry.ts` covers the contract well in isolation, but nothing in the repo verifies end-to-end behavior from `apps/agent` through `apps/server` into `packages/contracts/contracts/LogRegistry.sol`.

## Testing and developer experience gaps
- Automated test maturity is uneven: `packages/contracts/test/LogRegistry.ts` is the only real test suite, while `apps/web/package.json` has no test script and `apps/agent/package.json` treats compilation as testing.
- The documented testing and scripting structure in `tests/README.md`, `tests/performance/README.md`, and `scripts/README.md` is still mostly planned work; the corresponding directories do not yet contain executable performance, integration, or helper scripts.
- Package-level dependency management is inconsistent for a monorepo-style repo. `apps/server/package-lock.json`, `apps/agent/package-lock.json`, `apps/web/package-lock.json`, and `packages/contracts/package-lock.json` all exist separately, but there is no workspace bootstrap flow to ensure all packages are installed before validation commands are run.
- Current validation is confusing for new contributors: `apps/web` builds successfully, but `apps/server/package.json`, `apps/agent/package.json`, and `packages/contracts/package.json` can all fail quickly in a partially installed workspace, making the repo feel less healthy than the code alone suggests.

## Practical next fixes to consider
- Align the default ports and demo instructions across `apps/server/src/config/env.ts`, `apps/server/.env.example`, `apps/agent/src/config/env.ts`, and `apps/agent/.env.example`.
- Replace string-built SQL in `apps/server/src/repositories/logRepository.ts` with prepared statements or a safer SQLite layer, and reconsider the `sql.js` full-file persistence model in `apps/server/src/db/sqliteClient.ts`.
- Preserve raw log fidelity in `apps/agent/src/collector/fileReader.ts` and add explicit handling for blank lines, rotation, and truncation.
- Introduce a real shared package under `packages/shared` for API payloads used by `apps/agent`, `apps/server`, and `apps/web`.
- Add at least one runnable integration path: Agent submission tests for `apps/agent` + `apps/server`, endpoint tests for `apps/server`, and a mock/real API switch for `apps/web`.
