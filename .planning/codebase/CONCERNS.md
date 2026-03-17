# Codebase Concerns

## Highest-Level Gaps
- The codebase plan is broader than the implementation described in `PROJECT_STRUCTURE.md`.
- `packages/shared` is still only a placeholder, so shared DTOs and schemas are missing.
- Backend-to-blockchain integration is planned but not implemented.
- Frontend is still mock-driven and not connected to real backend endpoints.

## Architecture Drift
- Planned backend directories like `apps/server/src/blockchain` and `apps/server/src/validators` do not currently exist.
- Planned shared source layout under `packages/shared/src/` does not exist.
- Planned agent structure in `PROJECT_STRUCTURE.md` differs from implemented folders like `apps/agent/src/collector` and `apps/agent/src/retry`.
- Root `package.json` is still a placeholder even though the repo structure implies unified workspace management.

## Security Concerns
- No application-level authentication or authorization was found in `apps/server` or `apps/web`.
- CORS is broadly enabled in `apps/server/src/app.ts`.
- Log submission endpoints accept client input with only lightweight validation in `apps/server/src/controllers/logController.ts`.
- SQL handling in `apps/server/src/repositories/logRepository.ts` relies on string construction rather than robust parameterized queries.

## Performance Concerns
- `sql.js` usage in `apps/server/src/db/sqliteClient.ts` reads and writes the whole database file in process memory.
- That approach can become a bottleneck under sustained log ingestion.
- Overview queries in `apps/server/src/repositories/overviewRepository.ts` appear to perform multiple separate database reads.
- The current storage approach is fine for demos but weak for higher-volume scenarios.

## Reliability Concerns
- Agent retries drop items after max retry count in `apps/agent/src/retry/retryQueue.ts`.
- There is no dead-letter queue or manual recovery workflow.
- Agent file reading in `apps/agent/src/collector/fileReader.ts` can load large newly appended content in one pass.
- Offset persistence in `apps/agent/src/state/offsetStore.ts` is useful, but recovery around file rotation and corrupted state appears limited.

## Integrity Concerns
- `apps/agent/src/collector/fileReader.ts` trims log lines, which may alter original content.
- That can become a problem if hash reproducibility and forensic accuracy matter.
- Blockchain anchoring exists in `packages/contracts`, but the live backend flow does not yet use it.
- Audit and alert endpoints exist, but deeper audit execution logic is still thin.

## Testing And Maintainability Concerns
- Outside `packages/contracts`, automated tests are minimal.
- No repo-wide linting or formatting toolchain was found.
- Shared validation schemas are absent, so request rules are scattered.
- Root docs are not yet strong enough to serve as a complete onboarding guide.

## Relative Maturity
- Most mature package: `packages/contracts` because it has contract code, deployment scripts, and tests.
- Most mature runtime path: `apps/agent` feeding `apps/server` and SQLite.
- Most presentation-ready module: `apps/web`, but only as a prototype.
- Weakest strategic area: cross-package integration, especially shared schemas and blockchain hookup.

## Near-Term Priority Debt
- Implement shared types and request schemas in `packages/shared`.
- Wire `apps/server` to `packages/contracts` for real hash anchoring.
- Replace or rethink the current `sql.js` whole-file persistence model for heavier ingestion.
- Add baseline tests for server, agent, and web before expanding features further.
