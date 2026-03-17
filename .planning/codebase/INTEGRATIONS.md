# External Integrations Map

## What counts as an integration here

- This map covers runtime boundaries between modules, infrastructure dependencies, and third-party packages/services that the code explicitly talks to or is prepared to talk to.
- It distinguishes between implemented integrations and planned-but-not-yet-wired integrations.

## Integration status snapshot

| Integration | Status | Where configured | Key files |
| --- | --- | --- | --- |
| Agent -> Server HTTP | Implemented | `apps/agent/.env.example` | `apps/agent/src/http/logApiClient.ts`, `apps/server/src/routes/logRoutes.ts` |
| Server -> SQLite file DB | Implemented | `apps/server/.env.example` | `apps/server/src/db/sqliteClient.ts`, `apps/server/src/db/schema.ts` |
| Contracts -> Hardhat local chain | Implemented for local dev | `packages/contracts/.env.example` | `packages/contracts/hardhat.config.ts`, `packages/contracts/scripts/deploy.ts` |
| Contracts -> OpenZeppelin library | Implemented at build/compile time | `packages/contracts/package.json` | `packages/contracts/contracts/LogRegistry.sol` |
| Web -> Mock data layer | Implemented | none required | `apps/web/src/api/mockClient.ts`, `apps/web/src/mock/data.ts` |
| Web -> Backend API | Planned, not wired | none found | `apps/web/src/pages/*.tsx`, `apps/web/README.md` |
| Server -> Blockchain write path | Planned, schema-ready only | none found | `apps/server/src/db/schema.ts`, `apps/server/src/services/healthService.ts` |

## Internal service-to-service integrations

### Agent -> Server API

- Purpose: send collected log lines and agent heartbeat/state updates from `apps/agent` into `apps/server`.
- Base URL: `SERVER_BASE_URL` in `apps/agent/.env.example`, defaulting to `http://127.0.0.1:3010` in `apps/agent/src/config/env.ts`.
- Endpoints:
  - `POST /api/logs` assembled by `getServerLogSubmitUrl()` in `apps/agent/src/config/env.ts` and handled by `apps/server/src/routes/logRoutes.ts`.
  - `POST /api/agents/state` assembled by `getServerAgentStateUrl()` in `apps/agent/src/config/env.ts` and handled by `apps/server/src/routes/logRoutes.ts`.
- Client implementation: built-in `fetch` calls in `apps/agent/src/http/logApiClient.ts`.
- Payload shaping and retries: `apps/agent/src/retry/retryQueue.ts`.
- Server-side persistence: `apps/server/src/repositories/logRepository.ts` writes received records into `logs` and `agent_states`.
- Practical note: `apps/server/.env.example` defaults to port `3001`, while `apps/agent/.env.example` points to `3010`; these defaults need alignment before local end-to-end runs.

### Web -> Mock data source

- Purpose: keep the UI navigable before backend integration is finished.
- Data entrypoints: `getDashboardData()`, `getLogs()`, and `getAlerts()` in `apps/web/src/api/mockClient.ts`.
- Backing fixtures: `apps/web/src/mock/data.ts`.
- Consumers: `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/LogsPage.tsx`, and `apps/web/src/pages/AlertsPage.tsx`.
- Audit page shortcut: `apps/web/src/pages/AuditPage.tsx` imports mock data directly from `apps/web/src/mock` instead of going through the client abstraction.
- Practical note: no `fetch`, `axios`, or live `/api/*` usage is present in `apps/web/src`, so the frontend currently has zero runtime dependency on the backend.

## Infrastructure and storage integrations

### Server -> SQLite database file

- Purpose: persist logs, hash records, audit records, alerts, and agent status locally.
- Library: `sql.js` declared in `apps/server/package.json` and used in `apps/server/src/db/sqliteClient.ts`.
- Default database path: `SQLITE_DB_PATH=../../storage/sqlite/graduation-project.db` in `apps/server/.env.example`.
- Schema definition: `apps/server/src/db/schema.ts`.
- Initialization and validation: `apps/server/src/db/initDatabase.ts`, `apps/server/src/db/verifyDatabase.ts`, and script wrappers in `apps/server/src/scripts/*.ts`.
- Persistence model: the database is opened in memory through `sql.js`, then exported back to a disk file by `persistDatabase()` in `apps/server/src/db/sqliteClient.ts`.
- Operational note: this is embedded/local storage, not a networked DB integration.

### Agent -> Local file system

- Purpose: read target log files and persist local offsets/retry queue state.
- Target log path config: `AGENT_LOG_FILE` in `apps/agent/.env.example` and `apps/agent/src/config/env.ts`.
- State file config: `AGENT_STATE_FILE` in `apps/agent/.env.example` and `apps/agent/src/config/env.ts`.
- Incremental reading: `apps/agent/src/collector/fileReader.ts`.
- State durability: `apps/agent/src/state/offsetStore.ts`.
- Bootstrap safeguards: `apps/agent/src/utils/fsHelpers.ts` and `apps/agent/src/agent/logAgent.ts` create missing files/directories as needed.

## Blockchain-related integrations

### Contracts -> Hardhat local JSON-RPC

- Purpose: compile, test, run a local chain, and deploy the `LogRegistry` contract.
- Tooling: Hardhat scripts in `packages/contracts/package.json`.
- Local RPC URL: `LOCALHOST_RPC_URL=http://127.0.0.1:8545` in `packages/contracts/.env.example` and `packages/contracts/hardhat.config.ts`.
- Deployment path: `packages/contracts/scripts/deploy.ts` using `hardhat run ... --network localhost` from `packages/contracts/package.json`.
- Tests: `packages/contracts/test/LogRegistry.ts` run entirely inside the Hardhat toolchain.
- Scope note: only local development networks are configured; no Sepolia, mainnet, Infura, Alchemy, or wallet private-key deployment flow is present.

### Contracts -> OpenZeppelin Contracts

- Purpose: reuse audited role-based access control primitives instead of hand-rolling authorization.
- Dependency declaration: `@openzeppelin/contracts` in `packages/contracts/package.json`.
- Import site: `packages/contracts/contracts/LogRegistry.sol` imports `@openzeppelin/contracts/access/AccessControl.sol`.
- Runtime effect: `LOGGER_ROLE` and `DEFAULT_ADMIN_ROLE` gates contract writes in `storeLog()`.

### Server -> Blockchain integration placeholder

- The data model is already shaped for on-chain traceability through `log_hash_records` fields such as `chain_name`, `contract_address`, `transaction_hash`, `block_number`, and `on_chain_status` in `apps/server/src/db/schema.ts`.
- Health reporting explicitly marks blockchain dependency as `pending` in `apps/server/src/services/healthService.ts`.
- No concrete backend blockchain client, RPC adapter, ethers/viem dependency, or `apps/server/src/blockchain/*` implementation is present.
- Practical takeaway: blockchain exists today as a contract package and DB-ready backend design, not as a live server integration.

## HTTP surface exposed by the backend

- Root check: `GET /` in `apps/server/src/app.ts`.
- Health endpoint: `GET /api/health` in `apps/server/src/routes/healthRoutes.ts`.
- Log ingestion/listing: `POST /api/logs` and `GET /api/logs` in `apps/server/src/routes/logRoutes.ts`.
- Agent state sync: `POST /api/agents/state` in `apps/server/src/routes/logRoutes.ts`.
- Read-only dashboard support endpoints already exist for future UI wiring:
  - `GET /api/overview` in `apps/server/src/routes/overviewRoutes.ts`
  - `GET /api/audits` in `apps/server/src/routes/auditRoutes.ts`
  - `GET /api/alerts` in `apps/server/src/routes/alertRoutes.ts`
- Browser access is enabled by permissive CORS middleware in `apps/server/src/app.ts`.

## Environment variable inventory

### Server

- `PORT` in `apps/server/.env.example`
- `NODE_ENV` in `apps/server/.env.example`
- `SQLITE_DB_PATH` in `apps/server/.env.example`

### Agent

- `NODE_ENV` in `apps/agent/.env.example`
- `AGENT_NAME` in `apps/agent/.env.example`
- `TASK_ID` in `apps/agent/.env.example`
- `AGENT_LOG_FILE` in `apps/agent/.env.example`
- `AGENT_STATE_FILE` in `apps/agent/.env.example`
- `SERVER_BASE_URL` in `apps/agent/.env.example`
- `SERVER_LOG_ENDPOINT` in `apps/agent/.env.example`
- `SERVER_AGENT_STATE_ENDPOINT` in `apps/agent/.env.example`
- `POLL_INTERVAL_MS`, `RETRY_INTERVAL_MS`, `MAX_RETRY_TIMES`, `LOG_LEVEL` in `apps/agent/.env.example`

### Contracts

- `LOCALHOST_RPC_URL` in `packages/contracts/.env.example`

## Notable non-integrations

- No cloud storage, message queue, Redis, Kafka, S3, or object storage integration found.
- No hosted authentication provider, OAuth flow, JWT issuer integration, or RBAC backend service found.
- No third-party observability SaaS, metrics exporter, or error tracker found.
- No live frontend API client library such as Axios or TanStack Query is used.
- No external blockchain RPC beyond local Hardhat `localhost` is configured.

## Practical risks and follow-ups

- Align the default server port mismatch between `apps/server/.env.example` and `apps/agent/.env.example` before demos.
- Add a real frontend API adapter parallel to `apps/web/src/api/mockClient.ts` when wiring `apps/web` to `apps/server`.
- Implement `apps/server/src/blockchain/` and add an RPC client dependency when moving from schema placeholders to real on-chain writes.
- Consider extracting shared DTOs into `packages/shared` so the Agent, Server, and Web stop duplicating contract shapes independently.
