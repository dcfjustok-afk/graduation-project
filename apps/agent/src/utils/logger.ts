export function logInfo(message: string, extra?: unknown) {
  if (extra === undefined) {
    console.log(`[agent] ${message}`);
    return;
  }

  console.log(`[agent] ${message}`, extra);
}

export function logError(message: string, error: unknown) {
  console.error(`[agent] ${message}`, error);
}