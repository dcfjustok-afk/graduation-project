# Codebase Stack

## Overview
- Repository shape: monorepo-style layout with multiple apps under `apps/` and packages under `packages/`.
- Current root `package.json` is a placeholder and does not define npm workspaces or shared root scripts.
- Main implementation language is TypeScript; smart contracts are written in Solidity.

## Languages And Runtimes
- TypeScript is used in `apps/server`, `apps/agent`, `apps/web`, and `packages/contracts`.
- Solidity is used in `packages/contracts/contracts/LogRegistry.sol`.
- Node.js `>=18` is required by `apps/server/package.json` and `apps/agent/package.json`.
- Browser runtime is used by the Vite frontend in `apps/web`.

## Application Frameworks
- Backend API: Express 5 in `apps/server/package.json` and `apps/server/src/app.ts`.
- Frontend UI: React 19, React Router, and Ant Design in `apps/web/package.json`.
- Frontend build tool: Vite in `apps/web/package.json` and `apps/web/vite.config.ts`.
- Contract toolchain: Hardhat in `packages/contracts/package.json` and `packages/contracts/hardhat.config.ts`.

## Storage And Persistence
- Primary local persistence uses `sql.js` with SQLite file storage in `apps/server/src/db/sqliteClient.ts`.
- Schema creation lives in `apps/server/src/db/schema.ts`.
- Database files are stored under `storage/sqlite/`.
- Agent local state persistence uses files through `apps/agent/src/state/offsetStore.ts`.

## Key Dependencies
- Server runtime dependencies: `express`, `cors`, `dotenv`, `sql.js` in `apps/server/package.json`.
- Agent runtime dependency: `dotenv` in `apps/agent/package.json`.
- Web runtime dependencies: `react`, `react-dom`, `react-router-dom`, `antd`, `@ant-design/icons` in `apps/web/package.json`.
- Contract dependencies: `@openzeppelin/contracts` plus Hardhat toolbox in `packages/contracts/package.json`.

## Build And Dev Tooling
- Server dev: `ts-node-dev --respawn --transpile-only src/index.ts` in `apps/server/package.json`.
- Agent dev: `ts-node-dev --respawn --transpile-only src/index.ts` in `apps/agent/package.json`.
- Web dev: `vite` in `apps/web/package.json`.
- Web typecheck: `tsc --noEmit` in `apps/web/package.json`.
- Contracts compile/test/node/deploy scripts live in `packages/contracts/package.json`.

## TypeScript Posture
- Strict mode is enabled in `apps/server/tsconfig.json`.
- Strict mode is enabled in `apps/agent/tsconfig.json`.
- Strict mode is enabled in `apps/web/tsconfig.json`.
- Strict mode is enabled in `packages/contracts/tsconfig.json`.

## Config Files
- Root placeholder config: `package.json`.
- Server config: `apps/server/package.json`, `apps/server/tsconfig.json`, `apps/server/.env.example`, `apps/server/src/config/env.ts`.
- Agent config: `apps/agent/package.json`, `apps/agent/tsconfig.json`, `apps/agent/.env.example`, `apps/agent/src/config/env.ts`.
- Web config: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`.
- Contracts config: `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/hardhat.config.ts`, `packages/contracts/.env.example`.

## Practical Notes
- The repo already looks like a monorepo, but dependency management is still package-by-package.
- The most production-like runtime path today is `apps/agent` -> `apps/server` -> `storage/sqlite`.
- The frontend in `apps/web` is polished enough for demos, but it is still mock-driven.
- The contract package is independently usable and more complete than several planned app integrations.
