export type ApiSourceMode = 'mock' | 'real';

const sourceMode = (import.meta.env.VITE_API_SOURCE || 'mock').toLowerCase();

export const apiEnv: { sourceMode: ApiSourceMode; baseUrl: string } = {
  sourceMode: sourceMode === 'real' ? 'real' : 'mock',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3010/api',
};