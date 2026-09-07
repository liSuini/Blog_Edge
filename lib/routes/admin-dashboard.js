// lib/routes/admin-dashboard.js — 仪表盘路由（需认证）

import { Router } from "express";
import { success } from "../middleware/response.js";
import * as articleRepo from "../repositories/article-repo.js";
import * as categoryRepo from "../repositories/category-repo.js";
import * as tagRepo from "../repositories/tag-repo.js";

export function createAdminDashboardRouter() {
  const router = Router();

  // GET /v1/admin/dashboard
  router.get("/", async (req, res, next) => {
    try {
      const counts = await articleRepo.countAll();
      const categories = await categoryRepo.listAll();
      const tags = await tagRepo.listAll();
      const recent = await articleRepo.getRecentArticles(5);

      res.json(success({
        article_count: counts.total,
        published_count: counts.published,
        draft_count: counts.draft,
        category_count: categories.length,
        tag_count: tags.length,
        recent_articles: recent,
      }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
