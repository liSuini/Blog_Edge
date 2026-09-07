// lib/routes/admin-images.js — 图片上传路由（需认证）

import { Router } from "express";
import { success, error, ErrorCode } from "../middleware/response.js";
import { uploadImage } from "../services/image-service.js";

export function createAdminImagesRouter() {
  const router = Router();

  // POST /v1/admin/images/upload — multipart/form-data
  router.post("/upload", async (req, res, next) => {
    try {
      const env = req.app.locals.env;

      // 从 multipart/form-data 中提取文件
      // EdgeOne Cloud Function 中 req.body 可能已被中间件解析
      // 这里使用简单的手动解析方式
      const file = req.file || req.body?.file;
      if (!file) {
        return res.json(error(ErrorCode.VALIDATION_ERROR, "请上传文件"));
      }

      // 如果 req.file 存在（multer 风格），直接使用
      if (req.file) {
        const fileObj = {
          buffer: req.file.buffer,
          filename: req.file.originalname || req.file.fieldname || "upload.png",
          mimetype: req.file.mimetype || "",
        };
        const url = await uploadImage(fileObj, env);
        return res.json(success({ url }));
      }

      // 兜底：如果 file 已是 buffer 对象
      if (Buffer.isBuffer(file)) {
        const url = await uploadImage({
          buffer: file,
          filename: req.body.filename || "upload.png",
          mimetype: req.body.mimetype || "",
        }, env);
        return res.json(success({ url }));
      }

      return res.json(error(ErrorCode.VALIDATION_ERROR, "文件格式不支持"));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
