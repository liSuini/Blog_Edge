// lib/middleware/error-handler.js — 统一错误处理中间件

import { ErrorCode, error, BusinessError } from "./response.js";

/**
 * Express 错误处理中间件（四参数签名）。
 *
 * 错误映射规则：
 *   BusinessError        → 使用 err.code 和 err.message
 *   参数校验错误（err.status === 400 / err.type === "entity.parse.failed"）
 *                        → HTTP 200 + code=40001
 *   未捕获异常           → HTTP 500 + code=50001
 */
export function errorHandler(err, req, res, _next) {
  // JSON body 解析失败
  if (err?.type === "entity.parse.failed" || err?.status === 400) {
    return res.status(200).json(error(ErrorCode.VALIDATION_ERROR, "参数校验错误"));
  }

  // 业务自定义错误
  if (err instanceof BusinessError) {
    // UNAUTHORIZED → HTTP 401，其余统一 HTTP 200
    const httpStatus = err.code === ErrorCode.UNAUTHORIZED ? 401 : 200;
    return res.status(httpStatus).json(error(err.code, err.message));
  }

  // 兜底
  console.error("[Unhandled Error]", err);
  return res.status(500).json(error(ErrorCode.INTERNAL_ERROR, "服务器内部错误"));
}
