const { spawn } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const isWindows = process.platform === 'win32';

function spawnProcess(command, args, options = {}) {
  const spawnOptions = {
    stdio: options.stdio || 'pipe',
    cwd: options.cwd || process.cwd(),
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  };

  const child = isWindows
    ? spawn('cmd.exe', ['/c', command, ...args], spawnOptions)
    : spawn(command, args, spawnOptions);

  if (options.label) {
    child.stdout?.on('data', (chunk) => {
      process.stdout.write(`[${options.label}] ${chunk}`);
    });
    child.stderr?.on('data', (chunk) => {
      process.stderr.write(`[${options.label}] ${chunk}`);
    });
  }

  return child;
}

function runNpm(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(npmCommand, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: ${npmCommand} ${args.join(' ')}`));
    });
  });
}

async function waitFor(check, description, timeoutMs = 30000, intervalMs = 500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const ready = await check();
      if (ready) {
        return;
      }
    } catch {
      // Ignore transient startup failures.
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out while waiting for ${description}`);
}

async function waitForRpc(url) {
  await waitFor(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
    });

    return response.ok;
  }, `RPC server at ${url}`);
}

async function isRpcReady(url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function waitForHttp(url) {
  await waitFor(async () => {
    const response = await fetch(url);
    return response.ok;
  }, `HTTP server at ${url}`);
}

async function isHttpReady(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function killProcess(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }

    child.once('exit', () => resolve());
    child.kill('SIGTERM');

    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 5000).unref();
  });
}

async function startHardhatNode() {
  if (await isRpcReady('http://127.0.0.1:8545')) {
    return null;
  }

  const child = spawnProcess(npmCommand, ['--prefix', 'packages/contracts', 'run', 'node'], {
    label: 'hardhat',
  });

  child.on('error', (error) => {
    process.stderr.write(`[hardhat] ${String(error)}\n`);
  });

  await waitForRpc('http://127.0.0.1:8545');
  return child;
}

async function startServer() {
  if (await isHttpReady('http://127.0.0.1:3010/api/health')) {
    return null;
  }

  const child = spawnProcess('node', ['dist/index.js'], {
    cwd: 'apps/server',
    env: {
      PORT: '3010',
    },
    label: 'server',
  });

  child.on('error', (error) => {
    process.stderr.write(`[server] ${String(error)}\n`);
  });

  await waitForHttp('http://127.0.0.1:3010/api/health');
  return child;
}

module.exports = {
  killProcess,
  runNpm,
  startHardhatNode,
  startServer,
};