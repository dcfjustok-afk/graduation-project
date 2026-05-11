const { spawn } = require('node:child_process');
const path = require('node:path');
const { killProcess, runNpm, startHardhatNode, waitForHttp } = require('./localRuntime');

const repoRoot = path.resolve(__dirname, '..');
const concurrentlyBin = path.join(
  repoRoot,
  'node_modules',
  'concurrently',
  'dist',
  'bin',
  'concurrently.js',
);

async function main() {
  let hardhatNode;
  const appRunners = [];
  let shuttingDown = false;

  async function shutdown(exitCode = 0) {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await Promise.all([...appRunners].reverse().map((runner) => killProcess(runner)));
    await killProcess(hardhatNode);
    process.exit(exitCode);
  }

  function attachRunnerHandlers(runner) {
    runner.on('error', async (error) => {
      console.error('[dev] failed to start application processes', error);
      await shutdown(1);
    });

    runner.on('exit', async (code) => {
      await shutdown(code ?? 0);
    });
  }

  process.on('SIGINT', () => void shutdown(0));
  process.on('SIGTERM', () => void shutdown(0));

  hardhatNode = await startHardhatNode();
  await runNpm(['run', 'chain:deploy']);

  const serverRunner = spawn(
    process.execPath,
    [
      concurrentlyBin,
      '--names',
      'server',
      '--prefix-colors',
      'cyan',
      '--kill-others-on-fail',
      'npm --prefix apps/server run dev',
    ],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  appRunners.push(serverRunner);
  attachRunnerHandlers(serverRunner);

  await waitForHttp('http://127.0.0.1:3010/api/health');

  const appRunner = spawn(
    process.execPath,
    [
      concurrentlyBin,
      '--names',
      'agent,web',
      '--prefix-colors',
      'magenta,green',
      '--kill-others-on-fail',
      'npm --prefix apps/agent run dev',
      'npm --prefix apps/web run dev',
    ],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  appRunners.push(appRunner);
  attachRunnerHandlers(appRunner);
}

main().catch((error) => {
  console.error('[dev] failed', error);
  process.exit(1);
});
