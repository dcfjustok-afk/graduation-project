const { killProcess, runNpm, startHardhatNode, startServer } = require('./localRuntime');

async function main() {
  let hardhatNode;
  let serverProcess;

  try {
    hardhatNode = await startHardhatNode();
    await runNpm(['run', 'chain:deploy']);
    await runNpm(['--prefix', 'apps/server', 'run', 'build']);
    await runNpm(['--prefix', 'apps/agent', 'run', 'build']);
    await runNpm(['--prefix', 'apps/server', 'run', 'db:reset']);
    serverProcess = await startServer();
    await runNpm(['--prefix', 'apps/agent', 'run', 'verify:basic']);
    await runNpm(['--prefix', 'apps/agent', 'run', 'verify:e2e'], {
      env: {
        SERVER_BASE_URL: 'http://127.0.0.1:3010',
      },
    });
  } finally {
    await killProcess(serverProcess);
    await killProcess(hardhatNode);
  }
}

main().catch((error) => {
  console.error('[root:verify-agent] failed', error);
  process.exit(1);
});