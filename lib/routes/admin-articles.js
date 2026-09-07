// lib/routes/admin-articles.js — 后台文章路由（需认证）

import { Router } from "express";
import { success, error, ErrorCode, paginate } from "../middleware/response.js";
import * as articleService from "../services/article-service.js";
import * as articleRepo from "../repositories/article-repo.js";
import * as categoryRepo from "../repositories/category-repo.js";
import * as tagRepo from "../repositories/tag-repo.js";

export function createAdminArticlesRouter() {
  const router = Router();

  // GET /v1/admin/articles — 列表
  router.get("/", async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const size = Math.min(Math.max(parseInt(req.query.size) || 10, 1), 50);
      const status = req.query.status || undefined;
      const keyword = req.query.keyword || undefined;
      const includeDeleted = req.query.include_deleted === "true";

      const result = await articleRepo.listAdmin({ page, size, status, keyword, includeDeleted });
      res.json(paginate(result.items, result.total, result.page, result.size));
    } catch (err) {
      next(err);
    }
  });

  // POST /v1/admin/articles — 创建
  router.post("/", async (req, res, next) => {
    try {
      const article = await articleService.createArticle(req.body);
      const detail = await buildDetail(article, false);
      res.json(success(detail));
    } catch (err) {
      next(err);
    }
  });

  // PUT /v1/admin/articles/:id — 更新
  router.put("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的文章ID"));

      const article = await articleService.updateArticle(id, req.body);
      const detail = await buildDetail(article, false);
      res.json(success(detail));
    } catch (err) {
      next(err);
    }
  });

  // DELETE /v1/admin/articles/:id — 软删除
  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的文章ID"));

      await articleRepo.softDelete(id);
      res.json(success(null));
    } catch (err) {
      next(err);
    }
  });

  // PATCH /v1/admin/articles/:id/status — 状态切换
  router.patch("/:id/status", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的文章ID"));

      const { status } = req.body;
      const article = await articleService.updateStatus(id, status);
      const detail = await buildDetail(article, false);
      res.json(success(detail));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/**
 * 构建文章详情响应对象。
 * @param {object} article
 * @param {boolean} withPrevNext
 */
async function buildDetail(article, withPrevNext) {
  let category = null;
  if (article.category_id) {
    const cat = await categoryRepo.getById(article.category_id);
    if (cat) category = { id: cat.id, name: cat.name, slug: cat.slug };
  }

  let tags = [];
  if (article.tag_ids && article.tag_ids.length > 0) {
    const tagObjs = await tagRepo.getByIds(article.tag_ids);
    tags = tagObjs.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
  }

  let prev_article = null;
  let next_article = null;
  if (withPrevNext) {
    const pn = await articleRepo.getPrevNext(article);
    prev_article = pn.prev;
    next_article = pn.next;
  }

  return {
    id: article.id,
    title: article.title,
    content: article.content,
    summary: article.summary,
    cover_image_url: article.cover_image_url,
    status: article.status,
    category,
    tags,
    created_at: article.created_at,
    updated_at: article.updated_at,
    published_at: article.published_at,
    prev_article,
    next_article,
  };
}
