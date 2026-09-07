// lib/routes/admin-config.js — 后台配置路由（需认证）

import { Router } from "express";
import { success } from "../middleware/response.js";
import { getSiteInfo, setSiteInfo, getAbout, setAbout } from "../repositories/config-repo.js";

export function createAdminConfigRouter() {
  const router = Router();

  // GET /v1/admin/config/site-info
  router.get("/site-info", async (req, res, next) => {
    try {
      const info = await getSiteInfo();
      res.json(success(info));
    } catch (err) {
      next(err);
    }
  });

  // PUT /v1/admin/config/site-info
  router.put("/site-info", async (req, res, next) => {
    try {
      const updated = await setSiteInfo(req.body);
      res.json(success(updated));
    } catch (err) {
      next(err);
    }
  });

  // PUT /v1/admin/config/about
  router.put("/about", async (req, res, next) => {
    try {
      const { content } = req.body;
      await setAbout(content || "");
      const about = await getAbout();
      res.json(success(about));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
