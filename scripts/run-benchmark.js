const path = require('node:path');
const { killProcess, runNpm, startHardhatNode, startServer } = require('./localRuntime');

const mode = process.argv[2];

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
    await runNpm(['--prefix', 'apps/server', 'run', 'db:reset']);

    if (mode === 'audits') {
      await runNpm(['--prefix', 'apps/server', 'run', 'demo:audit']);
    }

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