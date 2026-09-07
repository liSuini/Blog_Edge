// 原型2：Express 路由验证
// 部署为 cloud-functions/api/[[default]].js
// 验证 Express 路由在 EdgeOne 上的路径映射

import express from "express";

const app = express();
app.use(express.json());

// 测试 GET /api/v1/hello → Express 路由 /v1/hello
app.get("/v1/hello", (req, res) => {
  res.json({ code: 200, message: "success", data: { msg: "Hello from Express!" } });
});

// 测试动态路由 /api/v1/articles/:id → Express 路由 /v1/articles/:id
app.get("/v1/articles/:id", (req, res) => {
  res.json({
    code: 200,
    message: "success",
    data: { id: parseInt(req.params.id), title: "测试文章" }
  });
});

// 测试 POST /api/v1/articles → Express 路由 /v1/articles
app.post("/v1/articles", (req, res) => {
  res.status(201).json({
    code: 200,
    message: "success",
    data: { id: 999, ...req.body }
  });
});

// 测试中间件：模拟认证
app.use("/v1/admin", (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({
      code: 40101,
      message: "未认证或Token无效",
      data: null
    });
  }
  next();
});

app.get("/v1/admin/dashboard", (req, res) => {
  res.json({
    code: 200,
    message: "success",
    data: { article_count: 0, published_count: 0, draft_count: 0 }
  });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    code: 50001,
    message: "服务器内部错误",
    data: null
  });
});

// 必须导出 app，不能调用 app.listen()
export default app;
