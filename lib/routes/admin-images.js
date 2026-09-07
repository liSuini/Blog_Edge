// lib/routes/admin-images.js — 图片上传路由（需认证）
// 前端以 JSON base64 方式上传，兼容 EdgeOne Cloud Function 无 multipart 解析器的限制

import { Router } from "express";
import { success, error, ErrorCode } from "../middleware/response.js";
import { uploadImage } from "../services/image-service.js";

export function createAdminImagesRouter() {
  const router = Router();

  // POST /v1/admin/images/upload — JSON body { filename, mimetype, content(base64) }
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
