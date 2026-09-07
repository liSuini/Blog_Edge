// lib/repositories/tag-repo.js — 标签仓储（完整 CRUD）

import { getJSON, setJSON, delKey, listKeys } from "./blob-store.js";
import { getNextId } from "./id-counter.js";
import { BusinessError, ErrorCode } from "../middleware/response.js";

const PREFIX = "tags/";

/**
 * 列出所有标签，按 id ASC 排序。
 * @returns {Promise<Array>}
 */
export async function listAll() {
  const keys = await listKeys(PREFIX);
  const items = [];
  for (const key of keys) {
    const tag = await getJSON(key, null);
    if (tag) items.push(tag);
  }
  items.sort((a, b) => a.id - b.id);
  return items;
}

/**
 * 列出所有标签并附带文章计数。
 * @param {Array} articleIndex  索引数组
 * @returns {Promise<Array>}
 */
export async function listWithCount(articleIndex) {
  const tags = await listAll();
  const published = (articleIndex || []).filter((a) => a.status === "published" && !a.is_deleted);
  return tags.map((tag) => ({
    ...tag,
    article_count: published.filter((a) => (a.tag_ids || []).includes(tag.id)).length,
  }));
}

/**
 * 按 ID 获取标签。
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getById(id) {
  return getJSON(`${PREFIX}${id}.json`, null);
}

/**
 * 按 slug 获取标签。
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getBySlug(slug) {
  const all = await listAll();
  return all.find((t) => t.slug === slug) || null;
}

/**
 * 批量按 ID 获取标签。
 * @param {number[]} ids
 * @returns {Promise<Array>}
 */
export async function getByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const all = await listAll();
  return all.filter((t) => ids.includes(t.id));
}

/**
 * 创建标签。
 * @param {{name:string, slug:string}} data
 * @returns {Promise<object>}
 */
export async function create(data) {
  await ensureUnique(data.name, data.slug);
  const id = await getNextId("tag");
  const now = new Date().toISOString();
  const tag = { id, name: data.name, slug: data.slug, created_at: now };
  await setJSON(`${PREFIX}${id}.json`, tag);
  return tag;
}

/**
 * 更新标签（仅更新传入字段）。
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "标签不存在");

  if (data.name || data.slug) {
    const all = await listAll();
    for (const t of all) {
      if (t.id === id) continue;
      if (data.name && t.name === data.name) {
        throw new BusinessError(ErrorCode.CONFLICT, "标签名称已存在");
      }
      if (data.slug && t.slug === data.slug) {
        throw new BusinessError(ErrorCode.CONFLICT, "标签slug已存在");
      }
    }
  }

  const updated = { ...existing };
  if (data.name !== undefined) updated.name = data.name;
  if (data.slug !== undefined) updated.slug = data.slug;

  await setJSON(`${PREFIX}${id}.json`, updated);
  return updated;
}

/**
 * 删除标签，并从所有文章的 tag_ids 中移除该 ID。
 * @param {number} id
 * @param {object} articleRepo
 */
export async function remove(id, articleRepo) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "标签不存在");

  await delKey(`${PREFIX}${id}.json`);
  if (articleRepo && articleRepo.removeTagFromArticles) {
    await articleRepo.removeTagFromArticles(id);
  }
}

/**
 * 唯一性校验。
 */
async function ensureUnique(name, slug) {
  const all = await listAll();
  if (all.some((t) => t.name === name)) {
    throw new BusinessError(ErrorCode.CONFLICT, "标签名称已存在");
  }
  if (all.some((t) => t.slug === slug)) {
    throw new BusinessError(ErrorCode.CONFLICT, "标签slug已存在");
  }
}
