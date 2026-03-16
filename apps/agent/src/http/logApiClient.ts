import { getServerLogSubmitUrl } from "../config/env";
import { LogSubmitPayload } from "../types/agent";

/**
 * 调用后端日志提交接口。
 *
 * 当前使用 Node 18+ 内置 fetch，避免为了最小版本额外引入 HTTP 依赖。
 */
export async function submitLogToServer(payload: LogSubmitPayload) {
  const response = await fetch(getServerLogSubmitUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`日志上报失败，状态码 ${response.status}，响应内容：${body}`);
  }

  return response.json();
}