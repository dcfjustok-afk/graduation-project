import type { ApiListResponse, ApiResponse } from '../types';
import { apiEnv } from './env';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiEnv.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error?.code ? `${payload.error.code}: ${payload.message || '接口返回失败'}` : payload.message || '接口返回失败');
  }

  return payload.data;
}

async function post<T, TBody = unknown>(path: string, body?: TBody): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function requestList<T>(path: string): Promise<T[]> {
  const response = await fetch(`${apiEnv.baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  const payload = (await response.json()) as ApiListResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error?.code ? `${payload.error.code}: ${payload.message || '接口返回失败'}` : payload.message || '接口返回失败');
  }

  return payload.data;
}

export const httpClient = {
  request,
  requestList,
  post,
};
