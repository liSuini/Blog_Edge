// lib/routes/categories.js — 前台分类路由

import { Router } from "express";
import { success } from "../middleware/response.js";
import * as categoryRepo from "../repositories/category-repo.js";
import { getIndex } from "../repositories/article-repo.js";

export function createCategoriesRouter() {
  const router = Router();

  // GET /v1/categories
  router.get("/", async (req, res, next) => {
    try {
      const index = await getIndex();
      const categories = await categoryRepo.listWithCount(index);
      res.json(success(categories));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
