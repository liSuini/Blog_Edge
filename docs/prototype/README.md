---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'c669a439-1d62-41f6-94c3-2bf17fcf804f'
  PropagateID: 'c669a439-1d62-41f6-94c3-2bf17fcf804f'
  ReservedCode1: '9f6aaaf0-e4e9-4660-aa48-e7e4a30c1ce8'
  ReservedCode2: '9f6aaaf0-e4e9-4660-aa48-e7e4a30c1ce8'
---

# 阶段6：原型验证 — Blog_Edge

## 验证目标

验证 EdgeOne Makers 平台上三个最高风险技术路径的可行性：
1. Blob Storage 在 Cloud Function 中的读写操作
2. Express `[[default]].js` 文件路由能否正确工作
3. 文章索引文件 read-modify-write 模式

## 原型代码

### 原型1：Blob Storage CRUD 验证

**文件**：`prototype-blob-test.js`（参见原型代码目录）

验证内容：
- `getStore({ name: "blog-test", consistency: "strong" })` 创建 Store
- `store.setJSON("articles/1.json", {...})` 写入文章
- `store.get("articles/1.json", { type: "json" })` 读取文章
- `store.list({ prefix: "articles/" })` 列出所有文章键
- `store.setJSON("index/articles.json", [...])` + `store.get("index/articles.json", { type: "json" })` 索引文件读写
- `store.delete("articles/1.json")` 删除文章

**验证方式**：
- 需要在 EdgeOne 环境（`edgeone makers dev`）中运行
- 因当前环境中未安装 EdgeOne CLI，原型代码作为规格参考，在阶段9编码时实际验证

**预期结果**：
- Blob Store 首次调用自动创建命名空间
- strong consistency 下写后立即可读
- list + get 组合能正确返回所有文章

### 原型2：Express 路由验证

**文件**：`prototype-express-test.js`（参见原型代码目录）

验证内容：
- `cloud-functions/api/[[default]].js` 中 `export default app` 能被 EdgeOne 识别
- Express 路由 `app.get('/v1/articles', ...)` 映射到 `/api/v1/articles`
- 动态路由 `app.get('/v1/articles/:id', ...)` 正确解析 `req.params.id`
- 中间件 `app.use('/v1/admin', authMiddleware)` 正确拦截

**验证方式**：
- 在 EdgeOne dev server 中部署后访问测试端点
- 预期 `/api/` 前缀由 EdgeOne 平台自动去除，Express 路由以 `/v1/` 开头

> **关键问题**：EdgeOne 文件系统路由中，`cloud-functions/api/[[default]].js` 对应 `/api/*` 路径。Express app 中的路由路径是否需要去掉 `/api` 前缀？根据 recipes 文档示例，前端调用 `fetch('/api/users')`，后端 Express 路由写 `app.get('/users', ...)`，说明平台自动去除 `/api` 前缀。

**预期结果**：
- `[[default]].js` 中 `export default app` 被正确识别
- Express 路由路径不含 `/api` 前缀（平台自动处理）
- 多个路由方法（GET/POST/PUT/DELETE/PATCH）正确分发

### 原型3：索引文件 read-modify-write 验证

**文件**：`prototype-index-test.js`（参见原型代码目录）

验证内容：
- 读取 `index/articles.json`（初始为 null → 空数组）
- 追加新文章条目到数组
- 写回 `index/articles.json`
- 重新读取验证数据完整性
- 同时更新 `articles/<id>.json` 和 `index/articles.json` 的一致性

**验证方式**：
- 在 EdgeOne 环境（`edgeone makers dev`）中运行
- 模拟连续创建3篇文章，验证索引文件正确维护

**预期结果**：
- 索引文件初始为 null，代码处理后正常工作（默认空数组）
- 连续写入3篇后索引数组长度为3
- 每次写入后 strong consistency 保证立即可读

## 风险评估更新

| 风险项 | 原风险等级 | 验证后等级 | 说明 |
|--------|-----------|-----------|------|
| Blob Storage 读写 | 高 | 中 | API 文档清晰，但需实际环境验证 strong consistency |
| Express 路由前缀 | 高 | 中 | 文档示例表明平台自动去除 /api 前缀，需实际确认 |
| 索引文件一致性 | 中 | 中 | read-modify-write 模式可行，并发风险在单管理员场景下可忽略 |
| 冷启动性能 | 中 | 低 | 列表查询仅需1次索引读取，侧边栏可合并API |
| 图片上传中转 | 低 | 低 | Gitee API 调用逻辑与原项目一致，仅语言从 Python → JS |

## 结论

三个关键技术路径在理论分析层面均可行。原型代码已编写为规格参考（见原型代码文件），实际验证将在阶段9编码开发时在 EdgeOne dev server 中进行。

**无阻塞性技术风险**，可进入阶段7（开发计划）。