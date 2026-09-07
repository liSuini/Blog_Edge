// lib/routes/tags.js — 前台标签路由

import { Router } from "express";
import { success } from "../middleware/response.js";
import * as tagRepo from "../repositories/tag-repo.js";
import { getIndex } from "../repositories/article-repo.js";

export function createTagsRouter() {
  const router = Router();

  // GET /v1/tags
  router.get("/", async (req, res, next) => {
    try {
      const index = await getIndex();
      const tags = await tagRepo.listWithCount(index);
      res.json(success(tags));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
