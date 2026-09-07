// lib/services/article-service.js — 文章业务逻辑

import * as articleRepo from "../repositories/article-repo.js";
import { generateSummary } from "../utils/markdown.js";
import { BusinessError, ErrorCode } from "../middleware/response.js";

/**
 * 创建文章。
 * summary 为空时自动从 content 生成。
 *
 * @param {object} data  {title, content, summary?, cover_image_url?, category_id?, tag_ids?, status?}
 * @returns {Promise<object>}
 */
export async function createArticle(data) {
  if (!data.title || !data.title.trim()) {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "标题不能为空");
  }
  if (!data.content || !data.content.trim()) {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "正文不能为空");
  }
  if (data.summary && data.summary.length > 500) {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "摘要不能超过500字");
  }
  if (data.title.length > 200) {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "标题不能超过200字");
  }

  // summary 为空时自动生成
  if (!data.summary || !data.summary.trim()) {
    data.summary = generateSummary(data.content);
  }

  return articleRepo.create(data);
}

/**
 * 更新文章。
 * 状态切换时处理 published_at。
 *
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateArticle(id, data) {
  const existing = await articleRepo.getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "文章不存在");

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new BusinessError(ErrorCode.VALIDATION_ERROR, "标题不能为空");
    if (data.title.length > 200) throw new BusinessError(ErrorCode.VALIDATION_ERROR, "标题不能超过200字");
  }
  if (data.content !== undefined && !data.content.trim()) {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "正文不能为空");
  }
  if (data.summary !== undefined && data.summary.length > 500) {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "摘要不能超过500字");
  }

  return articleRepo.update(id, data);
}

/**
 * 更新文章状态。
 * @param {number} id
 * @param {string} status  "draft" | "published"
 * @returns {Promise<object>}
 */
export async function updateStatus(id, status) {
  if (status !== "draft" && status !== "published") {
    throw new BusinessError(ErrorCode.VALIDATION_ERROR, "状态值无效");
  }
  const existing = await articleRepo.getById(id);
  if (!existing) throw new BusinessError(ErrorCode.NOT_FOUND, "文章不存在");
  return articleRepo.updateStatus(id, status);
}
