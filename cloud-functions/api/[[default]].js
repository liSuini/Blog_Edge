// cloud-functions/api/[[default]].js — Express 单入口
// 处理所有 /api/* 请求（EdgeOne 平台自动去除 /api 前缀，路由写 /v1/*）

import express from "express";
import { errorHandler } from "../../lib/middleware/error-handler.js";
import { createAuthMiddleware } from "../../lib/middleware/auth.js";
import { createAuthRouter } from "../../lib/routes/auth.js";
import { createArticlesRouter } from "../../lib/routes/articles.js";
import { createCategoriesRouter } from "../../lib/routes/categories.js";
import { createTagsRouter } from "../../lib/routes/tags.js";
import { createConfigRouter } from "../../lib/routes/config.js";
import { createAdminArticlesRouter } from "../../lib/routes/admin-articles.js";
import { createAdminCategoriesRouter } from "../../lib/routes/admin-categories.js";
import { createAdminTagsRouter } from "../../lib/routes/admin-tags.js";
import { createAdminConfigRouter } from "../../lib/routes/admin-config.js";
import { createAdminDashboardRouter } from "../../lib/routes/admin-dashboard.js";
import { createAdminImagesRouter } from "../../lib/routes/admin-images.js";

const app = express();

// ---- 全局中间件 ----

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// JSON body 解析（限制 10MB 以支持图片 base64 上传）
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 将 context.env 存储到 app.locals 供路由访问
// EdgeOne 会注入 context.env，Cloud Function 入口接收
app.locals.env = process.env || {};

// ---- 健康检查（无需认证）----
app.get("/v1/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---- 前台路由（无需认证）----
app.use("/v1/auth", createAuthRouter(app.locals.env));
app.use("/v1/articles", createArticlesRouter());
app.use("/v1/categories", createCategoriesRouter());
app.use("/v1/tags", createTagsRouter());
app.use("/v1/config", createConfigRouter());

// ---- 后台路由（需认证）----
// 登录路由在认证中间件之前（已在上面挂载 /v1/auth）
// 以下 /v1/admin/* 路由需 JWT 认证
app.use("/v1/admin", createAuthMiddleware(app.locals.env));

app.use("/v1/admin/articles", createAdminArticlesRouter());
app.use("/v1/admin/categories", createAdminCategoriesRouter());
app.use("/v1/admin/tags", createAdminTagsRouter());
app.use("/v1/admin/config", createAdminConfigRouter());
app.use("/v1/admin/dashboard", createAdminDashboardRouter());
app.use("/v1/admin/images", createAdminImagesRouter());

// ---- 全局错误处理 ----
app.use(errorHandler);

export default app;
