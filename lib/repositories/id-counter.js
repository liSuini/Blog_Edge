// lib/repositories/id-counter.js — ID 自增计数器

import { getJSON, setJSON } from "./blob-store.js";

const COUNTERS_KEY = "index/counters.json";
const VALID_TYPES = ["article", "category", "tag"];

/**
 * 获取下一个自增 ID。
 * 读取 index/counters.json → 自增对应类型 → 写回 → 返回新 ID。
 *
 * @param {"article"|"category"|"tag"} type
 * @returns {Promise<number>}
 */
export async function getNextId(type) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid counter type: ${type}`);
  }

  let counters = await getJSON(COUNTERS_KEY, null);
  if (!counters) {
    counters = { article: 0, category: 0, tag: 0 };
  }
  counters[type] = (counters[type] || 0) + 1;
  await setJSON(COUNTERS_KEY, counters);
  return counters[type];
}

/**
 * 获取当前计数器值（不自增）。
 * @param {"article"|"category"|"tag"} type
 * @returns {Promise<number>}
 */
export async function getCurrentId(type) {
  const counters = await getJSON(COUNTERS_KEY, { article: 0, category: 0, tag: 0 });
  return counters[type] || 0;
}
