function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const ERROR_CODES = {
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  INTERNAL_ERROR: 'internal_error',
  INVALID_LOG_ID: 'invalid_log_id',
};



const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const AUDIT_STATUSES = {
  PASSED: 'passed',
  FAILED: 'failed',
  PENDING: 'pending',
};

const AGENT_RUN_STATUSES = {
  IDLE: 'idle',
  RUNNING: 'running',
  RETRYING: 'retrying',
  ERROR: 'error',
};

const SERVER_ALERT_SEVERITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  INFO: 'info',
};

const SERVER_ALERT_STATUSES = {
  OPEN: 'open',
  PROCESSING: 'processing',
  IGNORED: 'ignored',
};

const VIEW_LOG_STATUSES = {
  CHAINED: '已上链',
  PENDING_AUDIT: '待审计',
  AUDIT_PASSED: '审计通过',
  ABNORMAL: '发现异常',
};

const VIEW_ALERT_LEVELS = {
  HIGH: '高危',
  MEDIUM: '中危',
  INFO: '提示',
};

const VIEW_ALERT_STATUSES = {
  OPEN: '待处理',
  PROCESSING: '处理中',
  IGNORED: '已忽略',
};

function createSuccessResponse(message, data) {
  return {
    success: true,
    message,
    data,
    error: null,
  };
}

function createErrorResponse(message, code = ERROR_CODES.INTERNAL_ERROR, details) {
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

function createListResponse(message, data) {
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

function validateLogSubmitPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('请求体必须为对象');
  }

  if (!isNonEmptyString(payload?.taskId)) {
    errors.push('taskId 为必填字段');
  }

  if (!isNonEmptyString(payload?.logContent)) {
    errors.push('logContent 为必填字段');
  }

  if (payload?.sourceType !== undefined && !isNonEmptyString(payload.sourceType)) {
    errors.push('sourceType 如传入则必须为非空字符串');
  }

  if (payload?.sourcePath !== undefined && payload.sourcePath !== null && typeof payload.sourcePath !== 'string') {
    errors.push('sourcePath 如传入则必须为字符串');
  }

  if (payload?.logLevel !== undefined && !isNonEmptyString(payload.logLevel)) {
    errors.push('logLevel 如传入则必须为非空字符串');
  }

  if (payload?.collectedAt !== undefined && !isNonEmptyString(payload.collectedAt)) {
    errors.push('collectedAt 如传入则必须为非空字符串');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateAgentStateSyncPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('请求体必须为对象');
  }

  if (!isNonEmptyString(payload?.agentName)) {
    errors.push('agentName 为必填字段');
  }

  if (payload?.sourcePath !== undefined && payload.sourcePath !== null && typeof payload.sourcePath !== 'string') {
    errors.push('sourcePath 如传入则必须为字符串');
  }

  if (payload?.lastOffset !== undefined && !Number.isFinite(Number(payload.lastOffset))) {
    errors.push('lastOffset 如传入则必须为数字');
  }

  if (payload?.lastHeartbeatAt !== undefined && payload.lastHeartbeatAt !== null && !isNonEmptyString(payload.lastHeartbeatAt)) {
    errors.push('lastHeartbeatAt 如传入则必须为非空字符串或 null');
  }

  if (payload?.lastSyncAt !== undefined && payload.lastSyncAt !== null && !isNonEmptyString(payload.lastSyncAt)) {
    errors.push('lastSyncAt 如传入则必须为非空字符串或 null');
  }

  if (payload?.status !== undefined && !isNonEmptyString(payload.status)) {
    errors.push('status 如传入则必须为非空字符串');
  }

  if (payload?.errorMessage !== undefined && payload.errorMessage !== null && typeof payload.errorMessage !== 'string') {
    errors.push('errorMessage 如传入则必须为字符串或 null');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  ERROR_CODES,
  LOG_LEVELS,
  AUDIT_STATUSES,
  AGENT_RUN_STATUSES,
  SERVER_ALERT_SEVERITIES,
  SERVER_ALERT_STATUSES,
  VIEW_LOG_STATUSES,
  VIEW_ALERT_LEVELS,
  VIEW_ALERT_STATUSES,
  createSuccessResponse,
  createErrorResponse,
  createListResponse,
  validateLogSubmitPayload,
  validateAgentStateSyncPayload,
};