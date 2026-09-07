// lib/repositories/admin-repo.js — 管理员凭证仓储

import { getJSON, setJSON } from "./blob-store.js";

const CREDENTIALS_KEY = "admin/credentials.json";

/**
 * 读取管理员凭证。
 * @returns {Promise<{username:string, password_hash:string} | null>}
 */
export async function getCredentials() {
  return getJSON(CREDENTIALS_KEY, null);
}

/**
 * 初始化管理员凭证（bcrypt 哈希后写入）。
 * 仅在凭证不存在时调用。
 *
 * @param {string} username
 * @param {string} password  明文密码
 */
export async function initCredentials(username, password) {
  const bcrypt = await import("bcrypt");
  const passwordHash = bcrypt.hashSync(password, 10);
  const credentials = { username, password_hash: passwordHash };
  await setJSON(CREDENTIALS_KEY, credentials);
  return credentials;
}

/**
 * 确保管理员凭证已初始化。
 * 如果凭证不存在，从环境变量读取并初始化。
 *
 * @param {Record<string, string>} env  context.env
 */
export async function ensureInitialized(env) {
  const existing = await getCredentials();
  if (existing) return existing;

  const username = env?.ADMIN_USERNAME || "admin";
  const password = env?.ADMIN_PASSWORD || "changeme123";
  return initCredentials(username, password);
}
