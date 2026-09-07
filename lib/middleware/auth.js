// lib/middleware/auth.js — JWT 认证中间件

import { ErrorCode, error } from "./response.js";
import { verifyToken } from "../services/auth-service.js";

/**
 * Express JWT 认证中间件。
 * 从 Authorization: Bearer <token> 提取 token 并验证。
 * 无效/缺失 → HTTP 401 + code=40101。
 *
 * @param {Record<string, string>} env  context.env（通过闭包注入）
 */
export function createAuthMiddleware(env) {
  return function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"] || "";
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json(error(ErrorCode.UNAUTHORIZED, "未认证或Token无效"));
    }

    const username = verifyToken(token, env);
    if (!username) {
      return res.status(401).json(error(ErrorCode.UNAUTHORIZED, "未认证或Token无效"));
    }

    // 注入用户信息供后续路由使用
    req.admin = { username };
    next();
  };
}

/**
 * 从 Authorization 头提取 Bearer token。
 * @param {string} authHeader
 * @returns {string}
 */
function extractBearerToken(authHeader) {
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return "";
}
