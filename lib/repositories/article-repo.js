// lib/repositories/article-repo.js — 文章仓储（CRUD + 索引维护）
// T012（读取）+ T018（写入）合并实现

import { getJSON, setJSON, listKeys } from "./blob-store.js";
import { getNextId } from "./id-counter.js";
import { BusinessError, ErrorCode } from "../middleware/response.js";
import * as categoryRepo from "./category-repo.js";
import * as tagRepo from "./tag-repo.js";

const ARTICLE_PREFIX = "articles/";
const INDEX_KEY = "index/articles.json";

// ==================== 索引操作 ====================

/**
 * 读取文章索引数组。
 * @returns {Promise<Array>}
 */
export async function getIndex() {
  return getJSON(INDEX_KEY, []);
}

/**
 * 写入文章索引数组。
 * @param {Array} index
 */
export async function setIndex(index) {
  await setJSON(INDEX_KEY, index);
}

// ==================== 读取操作（T012） ====================

/**
 * 按 ID 读取完整文章。
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getById(id) {
  return getJSON(`${ARTICLE_PREFIX}${id}.json`, null);
}

/**
 * 按 ID 读取已发布文章（status=published && !is_deleted）。
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getPublishedById(id) {
  const article = await getById(id);
  if (!article) return null;
  if (article.status !== "published" || article.is_deleted) return null;
  return article;
}

/**
 * 前台分页列表。
 * 从索引过滤 published && !is_deleted，支持 category_slug / tag_slug 过滤，
 * 按 published_at DESC 排序，关联填充 CategoryRef 和 TagRef[]。
 *
 * @param {{page?:number, size?:number, categorySlug?:string, tagSlug?:string}} opts
 * @returns {Promise<{items:Array, total:number, page:number, size:number}>}
 */
export async function listPublished(opts = {}) {
  const { page = 1, size = 10, categorySlug, tagSlug } = opts;

  let index = await getIndex();

  // 过滤已发布
  let filtered = index.filter((a) => a.status === "published" && !a.is_deleted);

  // 分类过滤
  if (categorySlug) {
    const cat = await categoryRepo.getBySlug(categorySlug);
    if (!cat) return { items: [], total: 0, page, size };
    filtered = filtered.filter((a) => a.category_id === cat.id);
  }

  // 标签过滤
  if (tagSlug) {
    const tag = await tagRepo.getBySlug(tagSlug);
    if (!tag) return { items: [], total: 0, page, size };
    filtered = filtered.filter((a) => (a.tag_ids || []).includes(tag.id));
  }

  // 排序：published_at DESC
  filtered.sort((a, b) => {
    const aa = a.published_at || a.created_at || "";
    const bb = b.published_at || b.created_at || "";
    return bb.localeCompare(aa);
  });

  const total = filtered.length;
  const start = (page - 1) * size;
  const paged = filtered.slice(start, start + size);

  // 关联填充
  const items = [];
  for (const entry of paged) {
    const card = await buildArticleCard(entry);
    items.push(card);
  }

  return { items, total, page, size };
}

/**
 * 后台分页列表。
 * 从索引过滤+排序+分页，支持 status/keyword/includeDeleted。
 *
 * @param {{page?:number, size?:number, status?:string, keyword?:string, includeDeleted?:boolean}} opts
 * @returns {Promise<{items:Array, total:number, page:number, size:number}>}
 */
export async function listAdmin(opts = {}) {
  const { page = 1, size = 10, status, keyword, includeDeleted = false } = opts;

  let index = await getIndex();

  let filtered = index.filter((a) => {
    if (!includeDeleted && a.is_deleted) return false;
    if (status && a.status !== status) return false;
    if (keyword && !a.title.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  // 排序：created_at DESC
  filtered.sort((a, b) => {
    const aa = a.created_at || "";
    const bb = b.created_at || "";
    return bb.localeCompare(aa);
  });

  const total = filtered.length;
  const start = (page - 1) * size;
  const paged = filtered.slice(start, start + size);

  // 关联填充（不含 content，含 is_deleted）
  const items = [];
  for (const entry of paged) {
    const item = await buildAdminArticleItem(entry);
    items.push(item);
  }

  return { items, total, page, size };
}

/**
 * 归档分组（按年月）。
 * @returns {Promise<Array>}
 */
export async function getArchive() {
  const index = await getIndex();
  const published = index.filter((a) => a.status === "published" && !a.is_deleted);

  const groups = {};
  for (const a of published) {
    const date = new Date(a.published_at || a.created_at);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const yk = String(year);
    if (!groups[yk]) groups[yk] = { year, months: {} };
    if (!groups[yk].months[month]) groups[yk].months[month] = [];
    groups[yk].months[month].push({
      id: a.id,
      title: a.title,
      published_at: a.published_at || a.created_at,
    });
  }

  const result = Object.values(groups)
    .sort((a, b) => b.year - a.year)
    .map((g) => ({
      year: g.year,
      months: Object.values(
        Object.keys(g.months)
          .sort((a, b) => Number(b) - Number(a))
          .reduce((acc, mk) => {
            acc[mk] = { month: Number(mk), articles: g.months[mk] };
            return acc;
          }, {})
      ),
    }));

  return result;
}

/**
 * 查找上下篇（已发布、未删除）。
 * 当前文章的上下篇 = published_at 相邻的文章。
 *
 * @param {object} article  当前文章
 * @returns {Promise<{prev:object|null, next:object|null}>}
 */
export async function getPrevNext(article) {
  const index = await getIndex();
  const published = index
    .filter((a) => a.status === "published" && !a.is_deleted && a.id !== article.id)
    .sort((a, b) => {
      const aa = a.published_at || a.created_at || "";
      const bb = b.published_at || b.created_at || "";
      return bb.localeCompare(aa);
    });

  const currentDate = article.published_at || article.created_at || "";

  let prev = null;
  let next = null;

  for (const a of published) {
    const aDate = a.published_at || a.created_at || "";
    if (aDate < currentDate) {
      // 比 current 早 → prev 候选（取最近的）
      if (!prev || aDate > (prev.published_at || prev.created_at)) {
        prev = a;
      }
    } else if (aDate > currentDate) {
      // 比 current 晚 → next 候选（取最近的）
      if (!next || aDate < (next.published_at || next.created_at)) {
        next = a;
      }
    }
  }

  return {
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
  };
}

/**
 * 统计文章数量。
 * @returns {Promise<{total:number, published:number, draft:number}>}
 */
export async function countAll() {
  const index = await getIndex();
  const notDeleted = index.filter((a) => !a.is_deleted);
  return {
    total: notDeleted.length,
    published: notDeleted.filter((a) => a.status === "published").length,
    draft: notDeleted.filter((a) => a.status === "draft").length,
  };
}

/**
 * 获取最近 n 篇文章（按 created_at DESC）。
 * @param {number} n
 * @returns {Promise<Array>}
 */
export async function getRecentArticles(n = 5) {
  const index = await getIndex();
  const sorted = [...index]
    .filter((a) => !a.is_deleted)
    .sort((a, b) => {
      const aa = a.created_at || "";
      const bb = b.created_at || "";
      return bb.localeCompare(aa);
    })
    .slice(0, n);

  const items = [];
  for (const entry of sorted) {
    const card = await buildArticleCard(entry);
    items.push(card);
  }
  return items;
}

// ==================== 写入操作（T018） ====================

/**
 * 创建文章。
 * 写入 articles/<id>.json + 更新 index/articles.json。
 *
 * @param {object} data  文章数据
 * @returns {Promise<object>}
 */
export async function create(data) {
  const id = await getNextId("article");
  const now = new Date().toISOString();
  const article = {
    id,
    title: data.title,
    content: data.content,
    summary: data.summary || "",
    cover_image_url: data.cover_image_url || null,
    status: data.status || "draft",
    is_deleted: false,
    category_id: data.category_id ?? null,
    tag_ids: data.tag_ids || [],
    created_at: now,
    updated_at: now,
    published_at: data.status === "published" ? now : null,
  };

  await setJSON(`${ARTICLE_PREFIX}${id}.json`, article);

  // 更新索引
  const index = await getIndex();
  index.push(toIndexEntry(article));
  await setIndex(index);

  return article;
}

/**
 * 更新文章（仅更新传入字段，exclude_unset 语义）。
 * 同时更新文章文件和索引。
 *
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "文章不存在");

  const updated = { ...existing };

  if (data.title !== undefined) updated.title = data.title;
  if (data.content !== undefined) updated.content = data.content;
  if (data.summary !== undefined) updated.summary = data.summary;
  if (data.cover_image_url !== undefined) updated.cover_image_url = data.cover_image_url;
  if (data.category_id !== undefined) updated.category_id = data.category_id;
  if (data.tag_ids !== undefined) updated.tag_ids = data.tag_ids;
  if (data.status !== undefined) {
    // draft → published 且 published_at 为 null → 写入 published_at
    if (data.status === "published" && existing.status !== "published") {
      updated.published_at = existing.published_at || new Date().toISOString();
    }
    updated.status = data.status;
  }

  updated.updated_at = new Date().toISOString();

  await setJSON(`${ARTICLE_PREFIX}${id}.json`, updated);

  // 更新索引
  const index = await getIndex();
  const idx = index.findIndex((a) => a.id === id);
  if (idx >= 0) {
    index[idx] = toIndexEntry(updated);
    await setIndex(index);
  }

  return updated;
}

/**
 * 软删除文章（is_deleted=true）。
 * @param {number} id
 */
export async function softDelete(id) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "文章不存在");

  existing.is_deleted = true;
  existing.updated_at = new Date().toISOString();
  await setJSON(`${ARTICLE_PREFIX}${id}.json`, existing);

  // 更新索引
  const index = await getIndex();
  const idx = index.findIndex((a) => a.id === id);
  if (idx >= 0) {
    index[idx] = toIndexEntry(existing);
    await setIndex(index);
  }
}

/**
 * 更新文章状态。
 * draft → published 且 published_at 为 null → 写入 published_at。
 *
 * @param {number} id
 * @param {string} status  "draft" | "published"
 * @returns {Promise<object>}
 */
export async function updateStatus(id, status) {
  const existing = await getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "文章不存在");

  existing.status = status;
  if (status === "published" && !existing.published_at) {
    existing.published_at = new Date().toISOString();
  }
  existing.updated_at = new Date().toISOString();

  await setJSON(`${ARTICLE_PREFIX}${id}.json`, existing);

  // 更新索引
  const index = await getIndex();
  const idx = index.findIndex((a) => a.id === id);
  if (idx >= 0) {
    index[idx] = toIndexEntry(existing);
    await setIndex(index);
  }

  return existing;
}

/**
 * 批量将分类 ID 匹配的文章的 category_id 置 null。
 * 删除分类时调用。
 *
 * @param {number} categoryId
 */
export async function removeCategoryFromArticles(categoryId) {
  const index = await getIndex();
  let changed = false;

  for (const entry of index) {
    if (entry.category_id === categoryId) {
      const article = await getById(entry.id);
      if (article) {
        article.category_id = null;
        article.updated_at = new Date().toISOString();
        await setJSON(`${ARTICLE_PREFIX}${article.id}.json`, article);
      }
      entry.category_id = null;
      changed = true;
    }
  }

  if (changed) await setIndex(index);
}

/**
 * 批量从所有文章的 tag_ids 中移除指定标签 ID。
 * 删除标签时调用。
 *
 * @param {number} tagId
 */
export async function removeTagFromArticles(tagId) {
  const index = await getIndex();
  let changed = false;

  for (const entry of index) {
    if ((entry.tag_ids || []).includes(tagId)) {
      const article = await getById(entry.id);
      if (article) {
        article.tag_ids = (article.tag_ids || []).filter((t) => t !== tagId);
        article.updated_at = new Date().toISOString();
        await setJSON(`${ARTICLE_PREFIX}${article.id}.json`, article);
      }
      entry.tag_ids = (entry.tag_ids || []).filter((t) => t !== tagId);
      changed = true;
    }
  }

  if (changed) await setIndex(index);
}

// ==================== 辅助函数 ====================

/**
 * 从完整文章对象构建索引条目。
 * @param {object} article
 * @returns {object}
 */
function toIndexEntry(article) {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary || "",
    cover_image_url: article.cover_image_url || null,
    status: article.status,
    is_deleted: article.is_deleted,
    published_at: article.published_at || null,
    category_id: article.category_id ?? null,
    tag_ids: article.tag_ids || [],
    created_at: article.created_at,
    updated_at: article.updated_at,
  };
}

/**
 * 从索引条目构建 ArticleCard（前台卡片）。
 * @param {object} entry
 * @returns {Promise<object>}
 */
async function buildArticleCard(entry) {
  let category = null;
  if (entry.category_id) {
    const cat = await categoryRepo.getById(entry.category_id);
    if (cat) category = { id: cat.id, name: cat.name, slug: cat.slug };
  }

  let tags = [];
  if (entry.tag_ids && entry.tag_ids.length > 0) {
    const tagObjs = await tagRepo.getByIds(entry.tag_ids);
    tags = tagObjs.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
  }

  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary || "",
    cover_image_url: entry.cover_image_url || null,
    category,
    tags,
    published_at: entry.published_at || null,
  };
}

/**
 * 从索引条目构建 AdminArticleItem（后台列表项）。
 * @param {object} entry
 * @returns {Promise<object>}
 */
async function buildAdminArticleItem(entry) {
  let category = null;
  if (entry.category_id) {
    const cat = await categoryRepo.getById(entry.category_id);
    if (cat) category = { id: cat.id, name: cat.name, slug: cat.slug };
  }

  let tags = [];
  if (entry.tag_ids && entry.tag_ids.length > 0) {
    const tagObjs = await tagRepo.getByIds(entry.tag_ids);
    tags = tagObjs.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
  }

  return {
    id: entry.id,
    title: entry.title,
    status: entry.status,
    is_deleted: entry.is_deleted,
    category,
    tags,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    published_at: entry.published_at || null,
  };
}
