// lib/routes/articles.js — 前台文章路由

import { Router } from "express";
import { success, error, ErrorCode } from "../middleware/response.js";
import * as articleRepo from "../repositories/article-repo.js";
import * as categoryRepo from "../repositories/category-repo.js";
import * as tagRepo from "../repositories/tag-repo.js";

export function createArticlesRouter() {
  const router = Router();

  // GET /v1/articles — 分页列表
  router.get("/", async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const size = Math.min(Math.max(parseInt(req.query.size) || 10, 1), 50);
      const category_slug = req.query.category_slug || undefined;
      const tag_slug = req.query.tag_slug || undefined;

      const result = await articleRepo.listPublished({ page, size, categorySlug: category_slug, tagSlug: tag_slug });
      res.json({
        code: 200,
        message: "success",
        data: { items: result.items, total: result.total, page: result.page, size: result.size },
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /v1/articles/archive — 归档
  router.get("/archive", async (req, res, next) => {
    try {
      const groups = await articleRepo.getArchive();
      res.json(success(groups));
    } catch (err) {
      next(err);
    }
  });

  // GET /v1/articles/:id — 文章详情
  router.get("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的文章ID"));
      }

      const article = await articleRepo.getPublishedById(id);
      if (!article) {
        return res.json(error(ErrorCode.NOT_FOUND, "文章不存在"));
      }

      // 关联填充
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

      const { prev, next } = await articleRepo.getPrevNext(article);

      const detail = {
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
        prev_article: prev,
        next_article: next,
      };

      res.json(success(detail));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
