# Codebase Stack Map

## Repository shape

- The repository is organized as a monorepo-by-directory around `apps/`, `packages/`, `storage/`, `tests/`, and `scripts/` as described in `PROJECT_STRUCTURE.md`.
- There is a root `package.json`, but it is only a placeholder metadata file and does not define npm workspaces or shared build orchestration in `package.json`.
- Most runnable modules are independently managed Node/TypeScript projects under `apps/server`, `apps/web`, `apps/agent`, and `packages/contracts`.

## Repo-wide baseline

- Primary language: TypeScript across `apps/server`, `apps/web`, `apps/agent`, and Hardhat scripts/tests in `packages/contracts`.
- JavaScript runtime: Node.js 18+ is explicitly required by `apps/server/package.json` and `apps/agent/package.json`.
- Package manager: npm, with per-project lockfiles in `apps/server/package-lock.json`, `apps/web/package-lock.json`, `apps/agent/package-lock.json`, and `packages/contracts/package-lock.json`.
- Environment config style: `.env` files loaded through `dotenv` in `apps/server/src/config/env.ts`, `apps/agent/src/config/env.ts`, and `packages/contracts/hardhat.config.ts`.
- Documentation/planning support: Markdown-heavy repo docs plus spec tooling config in `openspec/config.yaml`.

## Frontend stack: `apps/web`

- Framework: React 19 via `apps/web/package.json` and bootstrap in `apps/web/src/main.tsx`.
- Build tool: Vite 7 with React plugin in `apps/web/vite.config.ts`.
- Language/tooling: TypeScript with `noEmit` type checking in `apps/web/tsconfig.json`.
- Routing: `react-router-dom` in `apps/web/src/router/index.tsx`.
- UI library: Ant Design 5 and `@ant-design/icons` in `apps/web/package.json` and component usage across `apps/web/src/pages/*.tsx`.
- Styling: handwritten global CSS in `apps/web/src/styles/index.css`; no Tailwind, CSS Modules, or CSS-in-JS found.
- Data layer: mock-only client in `apps/web/src/api/mockClient.ts` backed by static fixtures in `apps/web/src/mock/data.ts`.
- Output/build artifact: prebuilt frontend assets are present in `apps/web/dist/index.html` and `apps/web/dist/assets/*`.

## Backend stack: `apps/server`

- Framework: Express 5 in `apps/server/package.json` with app assembly in `apps/server/src/app.ts`.
- Language/tooling: TypeScript compiled to CommonJS via `apps/server/tsconfig.json`.
- Dev runner: `ts-node-dev` in `apps/server/package.json`.
- Middleware: `cors` and `express.json()` configured in `apps/server/src/app.ts`.
- Config loading: `dotenv` in `apps/server/src/config/env.ts`.
- Persistence engine: SQLite database file managed through `sql.js` in `apps/server/src/db/sqliteClient.ts`.
- Database schema: SQL DDL for `logs`, `log_hash_records`, `audit_records`, `alerts`, and `agent_states` in `apps/server/src/db/schema.ts`.
- Architecture style: route/controller/service/repository separation in `apps/server/src/routes`, `apps/server/src/controllers`, `apps/server/src/services`, and `apps/server/src/repositories`.
- API response envelope: shared helpers in `apps/server/src/utils/apiResponse.ts`.
- Runtime scripts: DB init/verify/seed scripts in `apps/server/src/scripts/initDatabase.ts`, `apps/server/src/scripts/verifyDatabase.ts`, and `apps/server/src/scripts/seedDemoData.ts`.

## Agent stack: `apps/agent`

- Runtime model: long-running Node.js polling agent started from `apps/agent/src/index.ts`.
- Language/tooling: TypeScript compiled to CommonJS via `apps/agent/tsconfig.json`.
- Dev runner: `ts-node-dev` in `apps/agent/package.json`.
- Config loading: `dotenv` in `apps/agent/src/config/env.ts`.
- File ingestion: Node `fs`-based incremental reads in `apps/agent/src/collector/fileReader.ts` and orchestration in `apps/agent/src/collector/logCollector.ts`.
- Scheduling model: interval polling in `apps/agent/src/agent/logAgent.ts`; no chokidar or OS-native watcher library is used.
- HTTP client: Node 18 built-in `fetch` in `apps/agent/src/http/logApiClient.ts`.
- Local durability: JSON state file persistence in `apps/agent/src/state/offsetStore.ts` plus retry queue logic in `apps/agent/src/retry/retryQueue.ts`.
- Demo helper: log appender script in `apps/agent/scripts/append-demo-log.js`.

## Smart contract stack: `packages/contracts`

- Contract language: Solidity 0.8.24 configured in `packages/contracts/hardhat.config.ts`.
- Tooling: Hardhat 2 with `@nomicfoundation/hardhat-toolbox` in `packages/contracts/package.json`.
- Contract library: OpenZeppelin Contracts, imported in `packages/contracts/contracts/LogRegistry.sol`.
- Contract pattern: role-based access control using `AccessControl` in `packages/contracts/contracts/LogRegistry.sol`.
- Scripts: deployment script in `packages/contracts/scripts/deploy.ts`.
- Tests: Hardhat + Mocha + Chai test suite in `packages/contracts/test/LogRegistry.ts`.
- Network targets: in-memory `hardhat` plus local JSON-RPC `localhost` in `packages/contracts/hardhat.config.ts`.

## Shared/supporting areas

- `packages/shared` is currently a placeholder with only `packages/shared/README.md`; no implemented shared runtime/types package exists yet.
- `tests/performance/README.md` reserves performance testing but no actual benchmark scripts are present now.
- `scripts/README.md` documents intended repo-level automation, but no executable repo-wide shell/TS scripts are currently checked in under `scripts/`.
- Graduation documentation inputs live in `doc/`, including `.doc` and `.txt` source materials.
- Spec workflow support exists under `.github/skills/*`, `.github/prompts/*`, and `openspec/`.

## Storage and generated artifacts

- SQLite database files are expected under `storage/sqlite/`, with the default path configured as `storage/sqlite/graduation-project.db` via `apps/server/.env.example`.
- Git ignores database files in `.gitignore` and `apps/server/.gitignore`.
- Generated contract outputs are expected under `packages/contracts/artifacts` and `packages/contracts/cache`, both ignored in `packages/contracts/.gitignore`.
- Generated server and agent outputs target `dist/` via `apps/server/tsconfig.json` and `apps/agent/tsconfig.json`.

## Current maturity notes

- The strongest implemented runtime pieces are `apps/server`, `apps/agent`, and `packages/contracts`.
- `apps/web` is production-buildable but still mock-data driven rather than wired to live APIs.
- The backend schema already reserves blockchain/audit fields, but real server-side blockchain integration code is not implemented yet; `apps/server/src/services/healthService.ts` still reports blockchain status as `pending`.
- The repo follows the planned monorepo architecture closely, but some planned zones remain placeholders, especially `packages/shared`, `tests/performance`, and repo-level `scripts/`.
