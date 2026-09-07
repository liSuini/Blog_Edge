// lib/repositories/blob-store.js — Blob Store 初始化封装（单例）

import { getStore } from "@edgeone/pages-blob";

const STORE_NAME = "blog-data";
const CONSISTENCY = "strong";

let _store = null;

/**
 * 获取 Blob Store 单例。
 * 使用 strong consistency 避免写后读到旧数据。
 *
 * EdgeOne Cloud Function 环境下 getStore 由 @edgeone/pages-blob 提供。
 * 本地测试通过 _setBlobStoreForTest 注入 mock。
 */
export function getBlobStore() {
  if (!_store) {
    _store = getStore({ name: STORE_NAME, consistency: CONSISTENCY });
  }
  return _store;
}

/**
 * 仅供测试用：注入 mock store。
 */
export function _setBlobStoreForTest(mockStore) {
  _store = mockStore;
}

// ---- 通用 JSON 读写辅助 ----

/**
 * 从 Blob 读取并解析 JSON，键不存在时返回 defaultValue。
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {Promise<*>}
 */
export async function getJSON(key, defaultValue = null) {
  const store = getBlobStore();
  const text = await store.get(key);
  if (text === null || text === undefined) return defaultValue;
  return JSON.parse(text);
}

/**
 * 将值序列化为 JSON 并写入 Blob。
 * @param {string} key
 * @param {*} value
 */
export async function setJSON(key, value) {
  const store = getBlobStore();
  await store.set(key, JSON.stringify(value));
}

/**
 * 删除 Blob 键。
 * @param {string} key
 */
export async function delKey(key) {
  const store = getBlobStore();
  await store.delete(key);
}

/**
 * 列出指定前缀下的所有键。
 * @param {string} prefix
 * @returns {Promise<string[]>}
 */
export async function listKeys(prefix) {
  const store = getBlobStore();
  const result = await store.list({ prefix });
  // EdgeOne list 返回 { keys: [...] } 或数组，兼容两种
  if (Array.isArray(result)) return result.map((k) => (typeof k === "string" ? k : k.name));
  if (result?.keys) return result.keys.map((k) => (typeof k === "string" ? k : k.name));
  return [];
}
