// lib/routes/admin-tags.js — 后台标签路由（需认证）

import { Router } from "express";
import { success, error, ErrorCode } from "../middleware/response.js";
import * as tagRepo from "../repositories/tag-repo.js";
import * as articleRepo from "../repositories/article-repo.js";

export function createAdminTagsRouter() {
  const router = Router();

  // GET /v1/admin/tags
  router.get("/", async (req, res, next) => {
    try {
      const tags = await tagRepo.listAll();
      res.json(success(tags));
    } catch (err) {
      next(err);
    }
  });

  // POST /v1/admin/tags
  router.post("/", async (req, res, next) => {
    try {
      const { name, slug } = req.body;
      if (!name || !slug) {
        return res.json(error(ErrorCode.VALIDATION_ERROR, "名称和slug不能为空"));
      }
      const tag = await tagRepo.create({ name, slug });
      res.json(success(tag));
    } catch (err) {
      next(err);
    }
  });

  // PUT /v1/admin/tags/:id
  router.put("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的ID"));

      const tag = await tagRepo.update(id, req.body);
      res.json(success(tag));
    } catch (err) {
      next(err);
    }
  });

  // DELETE /v1/admin/tags/:id
  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.json(error(ErrorCode.VALIDATION_ERROR, "无效的ID"));

      await tagRepo.remove(id, articleRepo);
      res.json(success(null));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
