/**
 * 统一 API 响应的数据结构。
 *
 * 设计这个类型的目的，是让前端、后端、后续 Agent 都能按同一种格式交互，
 * 这样更适合毕业设计讲解，也更利于后续扩展。
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * 创建成功响应。
 *
 * @param message 返回给调用方的简短说明
 * @param data 实际业务数据
 */
export function createSuccessResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * 创建失败响应。
 *
 * 当前先保留最小实现，后续可以扩展错误码、调试信息、字段级校验结果等内容。
 */
export function createErrorResponse(message: string): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
  };
}