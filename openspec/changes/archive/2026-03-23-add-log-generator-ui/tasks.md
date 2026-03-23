## 1. Backend API

- [x] 1.1 Confirm existing `POST /logs` payload contract in `@graduation-project/shared` and document required fields for UI mapping
- [x] 1.2 Add new endpoint `POST /logs/generate` (or `/logs/batch`) in `apps/server` with request validation and safe limits (max count, min interval)
- [x] 1.3 Implement service logic to batch-create logs by reusing the same persistence + chain write path as single submit
- [x] 1.4 Return structured batch response (successCount, failures[] with index/reason, optional created ids)
- [x] 1.5 Add basic guardrails for production (env flag to disable batch endpoint, rate limiting or hard cap)
- [x] 1.6 Add server tests for single submit validation and batch limits/partial failure behavior

## 2. Web UI Page

- [x] 2.1 Add a new page component (e.g., `LogGeneratorPage`) with a single-log form (task name/id, source type/path, level, content, collectedAt)
- [x] 2.2 Implement presets/quick-fill templates (INFO/WARN/ERROR, different source types) and ensure applying preset does not auto-submit
- [x] 2.3 Implement batch generation UI (count, interval, base payload, optional randomization) and show per-item failures
- [x] 2.4 Add page route + navigation entry in `apps/web/src/router/index.tsx` (and layout menu) using existing project conventions
- [x] 2.5 Add loading/progress states and success/error messaging (including created log id or batch summary)

## 3. Web API Integration

- [x] 3.1 Add `createLog` and `generateLogs` methods to `apps/web/src/api/dataService.ts`
- [x] 3.2 Implement real client calls for log creation/batch generation in `apps/web/src/api/realClient.ts`
- [x] 3.3 Implement mock-mode behavior in `apps/web/src/api/mockClient.ts` so generated logs appear in `LogsPage`
- [x] 3.4 Add a dedicated mapper to convert UI form fields to backend payload (keep UI fields decoupled)

## 4. Log List Refresh & UX

- [x] 4.1 Add an option to refresh logs list after generation (navigate-to-logs with query flag or provide a refresh button)
- [x] 4.2 Ensure newly created logs are visible in logs list in both mock and real modes

## 5. Verification

- [x] 5.1 Run server test suite and ensure new endpoints do not break existing agent flows
- [x] 5.2 Run web build and validate mobile/desktop layout for generator page
- [x] 5.3 Manual smoke test: create single log, create batch logs, verify logs appear in list, run audit to see pipeline end-to-end
