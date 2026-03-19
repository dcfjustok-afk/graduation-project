const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const baseUrl = process.env.BENCH_BASE_URL || 'http://127.0.0.1:3010';
const requestCount = Number(process.env.BENCH_LOG_REQUESTS || 100);
const resultsDir = path.resolve(__dirname, 'results');

async function submitLog(index) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/api/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      taskId: `bench-log-task-${Date.now()}-${index}`,
      sourceType: 'performance-script',
      sourcePath: '/tmp/performance.log',
      logContent: `performance log payload ${index} at ${new Date().toISOString()}`,
      logLevel: 'INFO',
      collectedAt: new Date().toISOString(),
    }),
  });
  const latencyMs = performance.now() - startedAt;
  const payload = await response.json();

  return {
    ok: response.ok && payload.success && !payload.data?.blockchainError,
    latencyMs,
  };
}

async function main() {
  const results = [];
  const startedAt = performance.now();

  for (let index = 0; index < requestCount; index += 1) {
    results.push(await submitLog(index));
  }

  const totalDurationMs = performance.now() - startedAt;
  const successCount = results.filter((item) => item.ok).length;
  const failureCount = requestCount - successCount;
  const latencies = results.map((item) => item.latencyMs);
  const avgLatencyMs = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
  const summary = {
    benchmark: 'log-submit',
    baseUrl,
    requestCount,
    successCount,
    failureCount,
    avgLatencyMs: Number(avgLatencyMs.toFixed(2)),
    minLatencyMs: Number(Math.min(...latencies).toFixed(2)),
    maxLatencyMs: Number(Math.max(...latencies).toFixed(2)),
    throughputPerSecond: Number((requestCount / (totalDurationMs / 1000)).toFixed(2)),
    executedAt: new Date().toISOString(),
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'log-submit-benchmark.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('[performance:logs] failed', error);
  process.exit(1);
});