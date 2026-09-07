// lib/routes/config.js — 前台配置路由

import { Router } from "express";
import { success } from "../middleware/response.js";
import { getSiteInfo, getAbout } from "../repositories/config-repo.js";

export function createConfigRouter() {
  const router = Router();

  // GET /v1/config/about
  router.get("/about", async (req, res, next) => {
    try {
      const about = await getAbout();
      res.json(success(about));
    } catch (err) {
      next(err);
    }
  });

  // GET /v1/config/site-info
  router.get("/site-info", async (req, res, next) => {
    try {
      const info = await getSiteInfo();
      res.json(success(info));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
