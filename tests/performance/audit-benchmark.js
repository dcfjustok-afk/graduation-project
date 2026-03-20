const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const baseUrl = process.env.BENCH_BASE_URL || 'http://127.0.0.1:3010';
const rounds = Number(process.env.BENCH_AUDIT_ROUNDS || 5);
const datasetSize = Number(process.env.BENCH_AUDIT_DATASET_SIZE || 100);
const resultsDir = path.resolve(__dirname, 'results');

async function runAuditRound() {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/api/audits/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const latencyMs = performance.now() - startedAt;
  const payload = await response.json();

  return {
    ok: response.ok && payload.success,
    latencyMs,
    processedCount: Array.isArray(payload.data) ? payload.data.length : 0,
  };
}

async function main() {
  const roundsResult = [];

  for (let index = 0; index < rounds; index += 1) {
    roundsResult.push(await runAuditRound());
  }

  const successCount = roundsResult.filter((item) => item.ok).length;
  const avgLatencyMs = roundsResult.reduce((sum, item) => sum + item.latencyMs, 0) / roundsResult.length;
  const avgProcessedCount = roundsResult.reduce((sum, item) => sum + item.processedCount, 0) / roundsResult.length;

  const summary = {
    benchmark: 'audit-run',
    baseUrl,
    datasetSize,
    rounds,
    successCount,
    failureCount: rounds - successCount,
    avgLatencyMs: Number(avgLatencyMs.toFixed(2)),
    maxLatencyMs: Number(Math.max(...roundsResult.map((item) => item.latencyMs)).toFixed(2)),
    avgProcessedCount: Number(avgProcessedCount.toFixed(2)),
    executedAt: new Date().toISOString(),
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, `audit-benchmark-${datasetSize}.json`), JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(path.join(resultsDir, 'audit-benchmark.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('[performance:audit] failed', error);
  process.exit(1);
});
