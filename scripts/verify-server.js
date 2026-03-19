const { killProcess, runNpm, startHardhatNode } = require('./localRuntime');

async function main() {
  let hardhatNode;

  try {
    hardhatNode = await startHardhatNode();
    await runNpm(['run', 'chain:deploy']);
    await runNpm(['--prefix', 'apps/server', 'run', 'build']);
    await runNpm(['--prefix', 'apps/server', 'run', 'db:reset']);
    await runNpm(['--prefix', 'apps/server', 'run', 'verify:api']);
    await runNpm(['--prefix', 'apps/server', 'run', 'demo:audit']);
    await runNpm(['--prefix', 'apps/server', 'run', 'verify:audit']);
  } finally {
    await killProcess(hardhatNode);
  }
}

main().catch((error) => {
  console.error('[root:verify-server] failed', error);
  process.exit(1);
});