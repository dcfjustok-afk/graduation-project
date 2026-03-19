function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function createSuccessResponse(message, data) {
  return {
    success: true,
    message,
    data,
  };
}

function createErrorResponse(message) {
  return {
    success: false,
    message,
    data: null,
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
  createSuccessResponse,
  createErrorResponse,
  createListResponse,
  validateLogSubmitPayload,
  validateAgentStateSyncPayload,
};