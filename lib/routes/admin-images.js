// lib/routes/admin-images.js — 图片上传路由（需认证）
// 前端直传 Gitee：后端只提供配置，前端直接调 Gitee API，跳过 EdgeOne 中转

import { Router } from "express";
import { success, error, ErrorCode } from "../middleware/response.js";
import { uploadImage } from "../services/image-service.js";

export function createAdminImagesRouter() {
  const router = Router();

  // GET /v1/admin/images/token — 返回 Gitee 上传配置（前端直传用）
  router.get("/token", (req, res, next) => {
    try {
      const env = req.app.locals.env;
      const token = env?.GITEE_TOKEN;
      const owner = env?.GITEE_REPO_OWNER;
      const repo = env?.GITEE_REPO_NAME;
      const branch = env?.GITEE_BRANCH || "master";
      const imagePath = env?.GITEE_IMAGE_PATH || "images";

      if (!token || !owner || !repo) {
        return res.json(error(ErrorCode.IMAGE_UPLOAD_FAILED, "图床配置不完整"));
      }

      return res.json(
        success({ token, owner, repo, branch, imagePath })
      );
    } catch (err) {
      next(err);
    }
  });

  // POST /v1/admin/images/upload — 后端代传（降级备用，前端直传失败时用）
  router.post("/upload", async (req, res, next) => {
    try {
      const env = req.app.locals.env;
      const { filename, mimetype, content } = req.body || {};

      if (!content) {
        return res.json(error(ErrorCode.VALIDATION_ERROR, "请上传文件"));
      }

      const buffer = Buffer.from(content, "base64");

      const fileObj = {
        buffer,
        filename: filename || "upload.png",
        mimetype: mimetype || "",
      };

      const url = await uploadImage(fileObj, env);
      return res.json(success({ url }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
