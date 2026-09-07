// lib/services/auth-service.js — 认证服务（JWT 签发/验证 + bcrypt 验证）

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getCredentials, ensureInitialized } from "../repositories/admin-repo.js";

/**
 * 管理员登录。
 * 1. ensureInitialized(env) 确保凭证存在
 * 2. 读取凭证 → bcrypt 验证 → JWT 签发
 *
 * @param {string} username
 * @param {string} password
 * @param {Record<string, string>} env  context.env
 * @returns {Promise<string|null>}  JWT token 或 null
 */
export async function login(username, password, env) {
  if (!username || !password) return null;

  await ensureInitialized(env);
  const cred = await getCredentials();
  if (!cred) return null;

  if (cred.username !== username) return null;

  const ok = bcrypt.compareSync(password, cred.password_hash);
  if (!ok) return null;

  return signToken(username, env);
}

/**
 * JWT 验签。
 * @param {string} token
 * @param {Record<string, string>} env
 * @returns {string|null}  username 或 null
 */
export function verifyToken(token, env) {
  if (!token) return null;
  const secret = env?.JWT_SECRET || "change-me";
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    return payload?.sub || null;
  } catch {
    return null;
  }
}

/**
 * 签发 JWT token。
 * @param {string} username
 * @param {Record<string, string>} env
 * @returns {string}
 */
function signToken(username, env) {
  const secret = env?.JWT_SECRET || "change-me";
  const expireHours = parseInt(env?.JWT_EXPIRE_HOURS || "24", 10);
  const payload = { sub: username };
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: `${expireHours}h` });
}
