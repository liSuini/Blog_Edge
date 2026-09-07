// lib/middleware/response.js — 统一响应工具

export const ErrorCode = {
  SUCCESS: 200,
  VALIDATION_ERROR: 40001,
  FILE_TOO_LARGE: 40002,
  UNSUPPORTED_FORMAT: 40003,
  UNAUTHORIZED: 40101,
  FORBIDDEN: 40301,
  NOT_FOUND: 40401,
  CONFLICT: 40901,
  INTERNAL_ERROR: 50001,
  IMAGE_UPLOAD_FAILED: 50002,
};

/**
 * 成功响应
 * @param {*} data
 * @param {string} [message="success"]
 * @returns {{code:number, message:string, data:*}}
 */
export function success(data = null, message = "success") {
  return { code: ErrorCode.SUCCESS, message, data };
}

/**
 * 分页成功响应
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} size
 * @returns {{code:number, message:string, data:{items:Array, total:number, page:number, size:number}}}
 */
export function paginate(items, total, page, size) {
  return {
    code: ErrorCode.SUCCESS,
    message: "success",
    data: { items, total, page, size },
  };
}

/**
 * 错误响应
 * @param {number} code
 * @param {string} message
 * @returns {{code:number, message:string, data:null}}
 */
export function error(code, message) {
  return { code, message, data: null };
}

/**
 * 业务异常类 — 携带 code + message，由 error-handler 中间件捕获
 */
export class BusinessError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "BusinessError";
  }
}
