// lib/routes/admin-categories.js — 后台分类路由（需认证）

import { Router } from "express";
import { success, error, ErrorCode } from "../middleware/response.js";
import * as categoryRepo from "../repositories/category-repo.js";
import * as articleRepo from "../repositories/article-repo.js";

export function createAdminCategoriesRouter() {
  const router = Router();

  // GET /v1/admin/categories
  router.get("/", async (req, res, next) => {
    try {
      const categories = await categoryRepo.listAll();
      res.json(success(categories));
    } catch (err) {
      next(err);
    }
  });

  // POST /v1/admin/categories
  router.post("/", async (req, res, next) => {
    try {
      const { name, slug, sort_order } = req.body;
      if (!name || !slug) {
        return res.json(error(ErrorCode.VALIDATION_ERROR, "名称和slug不能为空"));
      }
      const category = await categoryRepo.create({ name, slug, sort_order });
      res.json(success(category));
    } catch (err) {
      next(err);
    }
  });

  // PUT /v1/admin/categories/:id
  router.put("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的ID"));

      const category = await categoryRepo.update(id, req.body);
      res.json(success(category));
    } catch (err) {
      next(err);
    }
  });

  // DELETE /v1/admin/categories/:id
  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的ID"));

      // articleRepo passed as object with removeCategoryFromArticles
      await categoryRepo.remove(id, articleRepo);
      res.json(success(null));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
