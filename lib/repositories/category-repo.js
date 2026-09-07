// lib/repositories/category-repo.js — 分类仓储（完整 CRUD）

import { getJSON, setJSON, delKey, listKeys } from "./blob-store.js";
import { getNextId } from "./id-counter.js";
import { BusinessError, ErrorCode } from "../middleware/response.js";

const PREFIX = "categories/";

/**
 * 列出所有分类，按 sort_order ASC, id ASC 排序。
 * @returns {Promise<Array>}
 */
export async function listAll() {
  const keys = await listKeys(PREFIX);
  const items = [];
  for (const key of keys) {
    const cat = await getJSON(key, null);
    if (cat) items.push(cat);
  }
  items.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  return items;
}

/**
 * 列出所有分类并附带文章计数。
 * @param {Array} articleIndex  索引数组（index/articles.json）
 * @returns {Promise<Array>}
 */
export async function listWithCount(articleIndex) {
  const categories = await listAll();
  const published = (articleIndex || []).filter((a) => a.status === "published" && !a.is_deleted);
  return categories.map((cat) => ({
    ...cat,
    article_count: published.filter((a) => a.category_id === cat.id).length,
  }));
}

/**
 * 按 ID 获取分类。
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getById(id) {
  return getJSON(`${PREFIX}${id}.json`, null);
}

/**
 * 按 slug 获取分类。
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getBySlug(slug) {
  const all = await listAll();
  return all.find((c) => c.slug === slug) || null;
}

/**
 * 创建分类。
 * @param {{name:string, slug:string, sort_order?:number}} data
 * @returns {Promise<object>}
 */
export async function create(data) {
  await ensureUnique(data.name, data.slug);
  const id = await getNextId("category");
  const now = new Date().toISOString();
  const category = {
    id,
    name: data.name,
    slug: data.slug,
    sort_order: data.sort_order ?? 0,
    created_at: now,
  };
  await setJSON(`${PREFIX}${id}.json`, category);
  return category;
}

/**
 * 更新分类（仅更新传入字段）。
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "分类不存在");

  // 唯一性校验（排除自身）
  if (data.name || data.slug) {
    const all = await listAll();
    for (const c of all) {
      if (c.id === id) continue;
      if (data.name && c.name === data.name) {
        throw new BusinessError(ErrorCode.CONFLICT, "分类名称已存在");
      }
      if (data.slug && c.slug === data.slug) {
        throw new BusinessError(ErrorCode.CONFLICT, "分类slug已存在");
      }
    }
  }

  const updated = { ...existing };
  if (data.name !== undefined) updated.name = data.name;
  if (data.slug !== undefined) updated.slug = data.slug;
  if (data.sort_order !== undefined) updated.sort_order = data.sort_order;

  await setJSON(`${PREFIX}${id}.json`, updated);
  return updated;
}

/**
 * 删除分类，并解除关联文章的 category_id。
 * @param {number} id
 * @param {object} articleRepo  文章仓储实例（调用 removeCategoryFromArticles）
 */
export async function remove(id, articleRepo) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "分类不存在");

  await delKey(`${PREFIX}${id}.json`);
  if (articleRepo && articleRepo.removeCategoryFromArticles) {
    await articleRepo.removeCategoryFromArticles(id);
  }
}

/**
 * 唯一性校验。
 */
async function ensureUnique(name, slug) {
  const all = await listAll();
  if (all.some((c) => c.name === name)) {
    throw new BusinessError(ErrorCode.CONFLICT, "分类名称已存在");
  }
  if (all.some((c) => c.slug === slug)) {
    throw new BusinessError(ErrorCode.CONFLICT, "分类slug已存在");
  }
}
