const fs = require('node:fs');
const path = require('node:path');
const { killProcess, runNpm, startHardhatNode, startServer } = require('./localRuntime');

const mode = process.argv[2];
const resultsDir = path.resolve(__dirname, '../tests/performance/results');

const benchmarkScripts = {
  logs: path.resolve(__dirname, '../tests/performance/log-submit-benchmark.js'),
  audits: path.resolve(__dirname, '../tests/performance/audit-benchmark.js'),
};

async function main() {
  const targetScript = benchmarkScripts[mode];

  if (!targetScript) {
    throw new Error(`Unsupported benchmark mode: ${mode}`);
  }

  let hardhatNode;
  let serverProcess;

  try {
    hardhatNode = await startHardhatNode();
    await runNpm(['run', 'chain:deploy']);
    await runNpm(['--prefix', 'apps/server', 'run', 'build']);

    if (mode === 'audits') {
      const datasetSizes = (process.env.BENCH_AUDIT_DATASET_SIZES || '100,500,1000')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const summaries = [];

      for (const datasetSize of datasetSizes) {
        await runNpm(['--prefix', 'apps/server', 'run', 'db:reset']);
        await runNpm(['--prefix', 'apps/server', 'run', 'seed:audit-benchmark'], {
          env: {
            BENCH_AUDIT_DATASET_SIZE: datasetSize,
          },
        });

        serverProcess = await startServer();

        try {
          await runNpm(['exec', 'node', targetScript], {
            env: {
              BENCH_BASE_URL: 'http://127.0.0.1:3010',
              BENCH_AUDIT_DATASET_SIZE: datasetSize,
            },
          });
        } finally {
          await killProcess(serverProcess);
          serverProcess = null;
        }

        const summaryPath = path.join(resultsDir, `audit-benchmark-${datasetSize}.json`);
        if (fs.existsSync(summaryPath)) {
          summaries.push(JSON.parse(fs.readFileSync(summaryPath, 'utf8')));
        }
      }

      fs.mkdirSync(resultsDir, { recursive: true });
      fs.writeFileSync(
        path.join(resultsDir, 'audit-benchmark-tiers.json'),
        JSON.stringify(
          {
            benchmark: 'audit-run-tiers',
            datasets: summaries,
            executedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        'utf8',
      );
      fs.writeFileSync(
        path.join(resultsDir, 'audit-benchmark.json'),
        JSON.stringify(
          {
            benchmark: 'audit-run-tiers',
            datasets: summaries,
            executedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        'utf8',
      );

      console.log(JSON.stringify({ benchmark: 'audit-run-tiers', datasets: summaries }, null, 2));
      return;
    }

    await runNpm(['--prefix', 'apps/server', 'run', 'db:reset']);
    serverProcess = await startServer();
    await runNpm(['exec', 'node', targetScript], {
      env: {
        BENCH_BASE_URL: 'http://127.0.0.1:3010',
      },
    });
  } finally {
    await killProcess(serverProcess);
    await killProcess(hardhatNode);
  }
}

main().catch((error) => {
  console.error('[root:benchmark] failed', error);
  process.exit(1);
});