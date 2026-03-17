# Codebase Testing

## Current Testing Posture
- Automated testing is present mainly in the contract package.
- Server and agent scripts labeled as `test` are currently validation or build steps rather than assertion-heavy test suites.
- The frontend has no dedicated automated test script yet.

## Contract Tests
- Contract tests live in `packages/contracts/test/LogRegistry.ts`.
- Test execution is provided by `hardhat test` in `packages/contracts/package.json`.
- The package uses the Hardhat toolbox and Mocha/Chai stack from `packages/contracts/package.json`.
- Deployment support is separated into `packages/contracts/scripts/deploy.ts`.

## Server Validation Scripts
- Server `test` runs `npm run db:init && npm run db:verify` in `apps/server/package.json`.
- These scripts are useful sanity checks for storage setup.
- They are not a substitute for route, service, repository, or integration tests.
- Relevant scripts live under `apps/server/src/scripts/`.

## Agent Validation Scripts
- Agent `test` runs `npm run build` in `apps/agent/package.json`.
- This gives compile-time confidence only.
- No dedicated unit or integration test directory was found for agent runtime behaviors.

## Frontend Testing State
- `apps/web/package.json` defines `dev`, `build`, `preview`, and `typecheck` only.
- No Vitest, Jest, Playwright, or Cypress configuration was found.
- Current frontend validation appears to be manual previewing against mock data.

## Mock And Fixture Patterns
- Contract tests use a local helper fixture pattern inside `packages/contracts/test/LogRegistry.ts`.
- Frontend uses runtime mock data rather than test fixtures through `apps/web/src/mock/data.ts`.
- Mock API access is centralized in `apps/web/src/api/mockClient.ts`.
- Mock usage is somewhat inconsistent because some pages read mock data more directly than others.

## Coverage Observations
- Effective automated coverage is narrow and concentrated in `packages/contracts`.
- No coverage configuration or generated coverage reports were found at repo level.
- Backend API flows, agent retry logic, and frontend page behavior do not yet have strong automated coverage.

## Build And Type Safety As Guardrails
- Web typecheck runs through `tsc --noEmit` in `apps/web/package.json`.
- Server build runs through `tsc -p tsconfig.json` in `apps/server/package.json`.
- Agent build runs through `tsc -p tsconfig.json` in `apps/agent/package.json`.
- Contracts compile through `hardhat compile` in `packages/contracts/package.json`.

## Gaps Worth Closing
- Add server unit and route integration tests around log ingestion and overview endpoints.
- Add agent tests for incremental reads, retry dropping behavior, and offset recovery.
- Add frontend component or page tests plus an API adapter layer that can swap mock and real data.
- Add performance scripts under `tests/performance/` to match the intended project structure.
