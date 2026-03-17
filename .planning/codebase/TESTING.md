# Testing Patterns

## Current testing state
- The repository has uneven test maturity: only the Hardhat package contains executable automated tests today in `packages/contracts/test/LogRegistry.ts`.
- Other areas document testing intent but currently rely on build or operational checks rather than unit/integration suites, as shown in `apps/server/package.json`, `apps/agent/package.json`, `tests/README.md`, and `tests/performance/README.md`.
- There are no Jest, Vitest, React Testing Library, Playwright, Cypress, or supertest setups present in the current repo.

## Per-project test entry points
- Root `package.json` does not provide a real repository-wide test runner; its `test` script is still the default placeholder in `package.json`.
- Server testing is script-driven: `npm test` runs `npm run db:init && npm run db:verify` in `apps/server/package.json`.
- Agent testing is currently compile verification only: `npm test` runs `npm run build` in `apps/agent/package.json`.
- Contracts use the most complete setup: `npm test` runs `hardhat test` in `packages/contracts/package.json`.
- The web app has no `test` script; only `build` and `typecheck` are available in `apps/web/package.json`.

## Working automated test pattern: contracts
- Contract tests live beside the package in `packages/contracts/test/LogRegistry.ts` and use Mocha syntax with Chai assertions.
- The suite name matches the contract name via `describe("LogRegistry", ...)`, mirroring `packages/contracts/contracts/LogRegistry.sol`.
- Tests create a local deployment fixture helper inside the spec file with `deployFixture()` instead of relying on shared fixtures or external setup utilities.
- Assertions cover both state and events, for example `.to.emit(contract, "LogStored")` and direct record checks in `packages/contracts/test/LogRegistry.ts`.
- Negative-path testing is expected: unauthorized access, invalid empty inputs, and missing-record reads are all covered in `packages/contracts/test/LogRegistry.ts`.
- Hardhat matcher helpers are used for dynamic values such as timestamps via `anyValue` in `packages/contracts/test/LogRegistry.ts`.

## Server verification pattern
- Server "tests" validate deployability and database correctness, not endpoint behavior.
- `apps/server/src/scripts/initDatabase.ts` exercises schema creation through `initializeDatabase()` in `apps/server/src/db/initDatabase.ts`.
- `apps/server/src/scripts/verifyDatabase.ts` checks expected SQLite tables via `verifyDatabase()` in `apps/server/src/db/verifyDatabase.ts`.
- The verification logic asserts required tables from `requiredTables` in `apps/server/src/db/schema.ts`; this is effectively a schema smoke test.
- Because `apps/server/src/index.ts` also runs `initializeDatabase()` on startup, the current confidence model is "service boots and schema exists" rather than request-level regression coverage.

## Agent verification pattern
- The agent currently treats successful TypeScript compilation as the minimal quality gate in `apps/agent/package.json`.
- There are no direct tests for incremental file reads, queue persistence, retry scheduling, or HTTP failure handling despite those behaviors living in `apps/agent/src/collector/fileReader.ts`, `apps/agent/src/state/offsetStore.ts`, and `apps/agent/src/retry/retryQueue.ts`.
- Operational verification is documented through a manual closed-loop demo in `apps/agent/README.md`: start server, run agent, append a demo log, then inspect `GET /api/logs` and the `agent_states` table.

## Web verification pattern
- The web app is currently verified by type safety and production build success through `npm run typecheck` and `npm run build` in `apps/web/package.json`.
- UI behavior is driven by typed mock data and async mock clients in `apps/web/src/mock/data.ts` and `apps/web/src/api/mockClient.ts`, which makes manual preview in `npm run dev` the practical current test mode.
- There are no component tests for filtering in `apps/web/src/pages/LogsPage.tsx`, no rendering tests for `apps/web/src/pages/AlertsPage.tsx`, and no route tests for `apps/web/src/router/index.tsx`.

## Manual and planned testing guidance already in repo
- `tests/README.md` defines the intended categories: unit, integration, performance, security verification, and tamper-detection experiments.
- `tests/performance/README.md` narrows planned performance work to batch log submission, batch audit pressure tests, and metrics such as throughput, success rate, and response time.
- `scripts/README.md` expects future repository-level helper scripts for one-click testing and environment checks, but those scripts do not exist yet.

## What "good" looks like in this codebase today
- Prefer typed tests close to the implementation package, as demonstrated by `packages/contracts/test/LogRegistry.ts`.
- Cover both happy paths and rejection/error paths; the contract suite is the clearest local precedent.
- Reuse small in-file setup helpers when the test surface is narrow, rather than building heavy global fixtures prematurely.
- For backend or agent work, keep at least a runnable smoke check in package scripts if full unit tests are not yet present, matching `apps/server/package.json` and `apps/agent/package.json`.

## Gaps to note when extending tests
- There is no shared test infrastructure across packages, so new test tools should likely be added per subproject instead of assuming a monorepo harness.
- Server endpoints in `apps/server/src/routes/*.ts` are currently untested; request/response coverage would need a new framework and HTTP harness.
- Agent stateful behaviors in `apps/agent/src/agent/logAgent.ts` and `apps/agent/src/retry/retryQueue.ts` would require filesystem and network mocking because the current implementation uses real `fs` and `fetch`.
- Web pages consume mock data rather than live API adapters, so future UI tests should validate rendering and interactions without over-coupling to transient demo copy in `apps/web/src/mock/data.ts`.

## Practical commands to use now
- Run contract tests with `npm test` from `packages/contracts`.
- Run the server smoke test with `npm test` from `apps/server` to initialize and verify SQLite schema.
- Run the agent verification with `npm test` from `apps/agent` to confirm TypeScript compiles cleanly.
- Run web validation with `npm run typecheck` or `npm run build` from `apps/web` since no formal test runner exists there yet.
