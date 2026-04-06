function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  INTERNAL_ERROR: 'internal_error',
  INVALID_LOG_ID: 'invalid_log_id',
};

export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

export const AUDIT_STATUSES = {
  PASSED: 'passed',
  FAILED: 'failed',
  PENDING: 'pending',
};

export const AGENT_RUN_STATUSES = {
  IDLE: 'idle',
  RUNNING: 'running',
  RETRYING: 'retrying',
  ERROR: 'error',
};

export const SERVER_ALERT_SEVERITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  INFO: 'info',
};

export const SERVER_ALERT_STATUSES = {
  OPEN: 'open',
  PROCESSING: 'processing',
  IGNORED: 'ignored',
};

export const VIEW_LOG_STATUSES = {
  CHAINED: '已上链',
  PENDING_AUDIT: '待审计',
  AUDIT_PASSED: '审计通过',
  ABNORMAL: '发现异常',
};

export const VIEW_ALERT_LEVELS = {
  HIGH: '高危',
  MEDIUM: '中危',
  INFO: '提示',
};

export const VIEW_ALERT_STATUSES = {
  OPEN: '待处理',
  PROCESSING: '处理中',
  IGNORED: '已忽略',
};

export function createSuccessResponse(message, data) {
  return {
    success: true,
    message,
    data,
    error: null,
  };
}

export function createErrorResponse(message, code = ERROR_CODES.INTERNAL_ERROR, details) {
  return {
    success: false,
    message,
    data: null,
    error: {
      code,
      details,
    },
  };
}

export function createListResponse(message, data) {
  return {
    success: true,
    message,
    data,
    meta: {
      total: data.length,
    },
    error: null,
  };
}

export function validateLogSubmitPayload(payload) {
  const errors = [];

  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: ['请求体必须为对象'] };
  }

  if (!isNonEmptyString(payload.taskId)) {
    errors.push('taskId 不能为空');
  }

  if (!isNonEmptyString(payload.sourceType)) {
    errors.push('sourceType 不能为空');
  }

  if (!isNonEmptyString(payload.logContent)) {
    errors.push('logContent 不能为空');
  }

  if (!isNonEmptyString(payload.logLevel)) {
    errors.push('logLevel 不能为空');
  }

  if (!isNonEmptyString(payload.collectedAt)) {
    errors.push('collectedAt 不能为空');
  }

  return { valid: errors.length === 0, errors };
}

export function validateAgentStateSyncPayload(payload) {
  const errors = [];

  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: ['请求体必须为对象'] };
  }

  if (!isNonEmptyString(payload.agentName)) {
    errors.push('agentName 不能为空');
  }

  if (payload.lastOffset !== undefined && typeof payload.lastOffset !== 'number') {
    errors.push('lastOffset 必须为数字');
  }

  return { valid: errors.length === 0, errors };
}