---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'c0a0aef7-e40f-480e-b1dc-8344399f8678'
  PropagateID: 'c0a0aef7-e40f-480e-b1dc-8344399f8678'
  ReservedCode1: 'e7e719e4-d0fc-4f1e-b53c-8c157a0f90c6'
  ReservedCode2: 'e7e719e4-d0fc-4f1e-b53c-8c157a0f90c6'
---

# 阶段8：任务拆分 — Blog_Edge

## 任务列表

---

### T001：创建项目 package.json
**复杂度**：S
**依赖**：无
**涉及文件**：`package.json`
**完成标准**：
- [ ] package.json 包含 name: "blog-edge", type: "module"
- [ ] dependencies: express, @edgeone/pages-blob, jsonwebtoken, bcrypt
- [ ] devDependencies: vitest
- [ ] scripts: dev=`edgeone makers dev -n blog-edge`, build=`vite build`, test=`vitest`

---

### T002：创建 Express 入口 [[default]].js
**复杂度**：S
**依赖**：T001
**涉及文件**：`cloud-functions/api/[[default]].js`
**完成标准**：
- [ ] 导入 express，创建 app，app.use(express.json())
- [ ] 挂载健康检查路由 `GET /v1/health` → `{status:"ok"}`
- [ ] 挂载全局错误处理中间件
- [ ] `export default app`
- [ ] CORS 头设置（Access-Control-Allow-Origin 等）

---

### T003：实现统一响应工具 response.js
**复杂度**：S
**依赖**：无
**涉及文件**：`lib/middleware/response.js`
**完成标准**：
- [ ] `success(data, message?)` → `{code:200, message:"success", data}`
- [ ] `error(code, message)` → `{code, message, data:null}`
- [ ] `paginate(items, total, page, size)` → `{items, total, page, size}`
- [ ] 导出 ErrorCode 常量（200/40001/40002/40003/40101/40401/40901/50001/50002）
- [ ] 单元测试通过

---

### T004：实现错误处理中间件 error-handler.js
**复杂度**：S
**依赖**：T003
**涉及文件**：`lib/middleware/error-handler.js`
**完成标准**：
- [ ] 参数校验错误 → HTTP 200 + `{code:40001, message:"参数校验错误"}`
- [ ] 未授权 → HTTP 401 + `{code:40101}`
- [ ] 未捕获异常 → HTTP 500 + `{code:50001, message:"服务器内部错误"}`
- [ ] 业务自定义错误对象（BusinessError with code+message）正确处理
- [ ] 单元测试通过

---

### T005：实现 Blob Store 初始化封装
**复杂度**：S
**依赖**：T001
**涉及文件**：`lib/repositories/blob-store.js`
**完成标准**：
- [ ] `getStore()` 返回 `getStore({name:"blog-data", consistency:"strong"})`
- [ ] 统一命名空间名称为 "blog-data"
- [ ] 单例模式避免重复创建

---

### T006：实现 ID 计数器 id-counter.js
**复杂度**：S
**依赖**：T005
**涉及文件**：`lib/repositories/id-counter.js`
**完成标准**：
- [ ] `getNextId(type)` 读取 `index/counters.json`，自增，写回，返回新ID
- [ ] type 支持 "article" / "category" / "tag"
- [ ] 计数器文件不存在时初始化为 `{article:0, category:0, tag:0}`
- [ ] 单元测试通过（mock Blob Store）

---

### T007：实现管理员凭证仓储 admin-repo.js
**复杂度**：M
**依赖**：T005
**涉及文件**：`lib/repositories/admin-repo.js`
**完成标准**：
- [ ] `getCredentials()` 读取 `admin/credentials.json`，返回 `{username, password_hash}` 或 null
- [ ] `initCredentials(username, password)` — bcrypt 哈希后写入
- [ ] `ensureInitialized(env)` — 检查凭证是否存在，不存在则从环境变量初始化
- [ ] 单元测试通过（mock Blob Store + mock bcrypt）

---

### T008：实现认证服务 auth-service.js
**复杂度**：M
**依赖**：T007
**涉及文件**：`lib/services/auth-service.js`
**完成标准**：
- [ ] `login(username, password)` — 读取凭证 + bcrypt 验证 + JWT 签发，返回 token 或 null
- [ ] `verifyToken(token)` — JWT 验签，返回 username 或 null
- [ ] JWT 使用 HS256，密钥从 context.env 读取
- [ ] Token 有效期可配置（默认24小时）
- [ ] 单元测试通过

---

### T009：实现认证中间件 auth.js
**复杂度**：S
**依赖**：T008
**涉及文件**：`lib/middleware/auth.js`
**完成标准**：
- [ ] 从 `Authorization: Bearer <token>` 提取 token
- [ ] 调用 `authService.verifyToken(token)` 验证
- [ ] 无效/无 token → 返回 HTTP 401 + `{code:40101}`
- [ ] 有效 → 调用 next()
- [ ] 排除登录路径 `/v1/auth/login`
- [ ] 单元测试通过

---

### T010：实现登录路由 routes/auth.js
**复杂度**：S
**依赖**：T008, T003
**涉及文件**：`lib/routes/auth.js`
**完成标准**：
- [ ] `POST /v1/auth/login` 接受 `{username, password}`
- [ ] 调用 authService.login → 成功返回 `{code:200, data:{token}}`
- [ ] 失败返回 `{code:40101, message:"用户名或密码错误", data:null}`
- [ ] 首次访问时触发 ensureInitialized
- [ ] 挂载到 Express app

---

### T011：实现 Markdown 摘要生成 markdown.js
**复杂度**：M
**依赖**：无
**涉及文件**：`lib/utils/markdown.js`
**完成标准**：
- [ ] `generateSummary(content)` 输入 Markdown 字符串
- [ ] 去除代码块/行内代码/图片/链接URL/标题标记/粗体斜体/引用/列表/水平线
- [ ] 取前200字 + "..."
- [ ] 空内容返回空字符串
- [ ] 单元测试通过（覆盖各种 Markdown 语法）

---

### T012：实现文章仓储 article-repo.js（读取部分）
**复杂度**：L
**依赖**：T005, T003
**涉及文件**：`lib/repositories/article-repo.js`
**完成标准**：
- [ ] `getById(id)` — 读取 `articles/<id>.json`
- [ ] `getPublishedById(id)` — 读取并过滤 status=published && !is_deleted
- [ ] `listPublished({page, size, categorySlug, tagSlug})` — 从索引文件读取，过滤+排序+分页，关联填充 CategoryRef 和 TagRef[]
- [ ] `listAdmin({page, size, status, keyword, includeDeleted})` — 从索引文件读取，过滤+排序+分页
- [ ] `getArchive()` — 从索引文件按年月分组
- [ ] `getPrevNext(article)` — 从索引文件查找上下篇
- [ ] `countAll()` — 从索引统计 {total, published, draft}
- [ ] `getRecentArticles(n)` — 最近n篇
- [ ] 单元测试通过（mock Blob Store + 预设索引数据）

---

### T013：实现分类仓储 category-repo.js（完整CRUD）
**复杂度**：M
**依赖**：T005, T006
**涉及文件**：`lib/repositories/category-repo.js`
**完成标准**：
- [ ] `listAll()` — list prefix "categories/" + 逐个 get，按 sort_order 排序
- [ ] `listWithCount(index)` — 在 listAll 基础上从索引统计 article_count
- [ ] `getById(id)` — 读取 `categories/<id>.json`
- [ ] `getBySlug(slug)` — list 查找匹配 slug
- [ ] `create(data)` — nextId + setJSON
- [ ] `update(id, data)` — 读取+合并+写回，唯一性校验排除自身
- [ ] `delete(id, articleRepo)` — 删除分类 + 调用 articleRepo 解除关联
- [ ] 唯一性校验：name 和 slug 不重复（冲突抛 BusinessError 40901）
- [ ] 单元测试通过

---

### T014：实现标签仓储 tag-repo.js（完整CRUD）
**复杂度**：M
**依赖**：T005, T006
**涉及文件**：`lib/repositories/tag-repo.js`
**完成标准**：
- [ ] `listAll()` — list prefix "tags/" + 逐个 get，按 id 排序
- [ ] `listWithCount(index)` — 从索引统计 article_count
- [ ] `getById(id)` / `getBySlug(slug)` / `getByIds(ids)` 批量查
- [ ] `create(data)` / `update(id, data)` / `delete(id, articleRepo)`
- [ ] 删除标签时调用 articleRepo 从文章 tag_ids 中移除
- [ ] 唯一性校验
- [ ] 单元测试通过

---

### T015：实现配置仓储 config-repo.js
**复杂度**：S
**依赖**：T005
**涉及文件**：`lib/repositories/config-repo.js`
**完成标准**：
- [ ] `getSiteInfo()` — 读取 `config/site.json`，缺失项用默认值填充
- [ ] `setSiteInfo(info)` — 仅更新非null字段，写回
- [ ] `getAbout()` — 读取 `config/about.json`，返回 `{content:""}`
- [ ] `setAbout(content)` — 写入 `config/about.json`
- [ ] 单元测试通过

---

### T016：实现前台文章路由 routes/articles.js
**复杂度**：M
**依赖**：T012, T013, T014, T003
**涉及文件**：`lib/routes/articles.js`
**完成标准**：
- [ ] `GET /v1/articles` — 分页列表，支持 category_slug / tag_slug 过滤
- [ ] `GET /v1/articles/archive` — 归档分组
- [ ] `GET /v1/articles/:id` — 文章详情 + 上下篇
- [ ] 所有响应使用统一格式
- [ ] 不存在返回 code=40401
- [ ] 挂载到 Express app

---

### T017：实现前台分类/标签/配置路由
**复杂度**：S
**依赖**：T013, T014, T015, T003
**涉及文件**：`lib/routes/categories.js`, `lib/routes/tags.js`, `lib/routes/config.js`
**完成标准**：
- [ ] `GET /v1/categories` — 含 article_count
- [ ] `GET /v1/tags` — 含 article_count
- [ ] `GET /v1/config/about` — 关于页内容
- [ ] `GET /v1/config/site-info` — 站点信息
- [ ] 挂载到 Express app

---

### T018：实现文章仓储写入操作（CRUD + 索引维护）
**复杂度**：L
**依赖**：T012, T006
**涉及文件**：`lib/repositories/article-repo.js`（扩展）
**完成标准**：
- [ ] `create(data)` — nextId + setJSON(articles/<id>.json) + 更新 index/articles.json
- [ ] `update(id, data)` — 读取+合并(exclude_unset)+写回文章 + 更新索引
- [ ] `softDelete(id)` — 设置 is_deleted=true + 更新索引
- [ ] `updateStatus(id, status)` — 切换状态 + 首次published写published_at + 更新索引
- [ ] `removeCategoryFromArticles(categoryId)` — 批量置 category_id=null
- [ ] `removeTagFromArticles(tagId)` — 批量从 tag_ids 移除
- [ ] 索引更新为 read-modify-write（read index → modify → write index）
- [ ] 单元测试通过

---

### T019：实现文章服务 article-service.js
**复杂度**：M
**依赖**：T018, T011
**涉及文件**：`lib/services/article-service.js`
**完成标准**：
- [ ] `createArticle(data)` — summary为空时调generateSummary + repo.create
- [ ] `updateArticle(id, data)` — 状态切换判断published_at + repo.update
- [ ] `updateStatus(id, status)` — repo.updateStatus
- [ ] 单元测试通过

---

### T020：实现后台文章路由 routes/admin-articles.js
**复杂度**：M
**依赖**：T019, T012, T003
**涉及文件**：`lib/routes/admin-articles.js`
**完成标准**：
- [ ] `GET /v1/admin/articles` — 分页+筛选+搜索
- [ ] `POST /v1/admin/articles` — 创建
- [ ] `PUT /v1/admin/articles/:id` — 更新
- [ ] `DELETE /v1/admin/articles/:id` — 软删除
- [ ] `PATCH /v1/admin/articles/:id/status` — 状态切换
- [ ] 参数校验：title(1-200), content(1+), summary(≤500)
- [ ] 挂载到 Express app（在认证中间件之后）

---

### T021：实现后台分类路由 routes/admin-categories.js
**复杂度**：S
**依赖**：T013, T003
**涉及文件**：`lib/routes/admin-categories.js`
**完成标准**：
- [ ] `GET /v1/admin/categories` — 列表（不含count）
- [ ] `POST /v1/admin/categories` — 创建（唯一性校验）
- [ ] `PUT /v1/admin/categories/:id` — 更新（唯一性排除自身）
- [ ] `DELETE /v1/admin/categories/:id` — 删除（级联解除文章关联）
- [ ] 挂载到 Express app

---

### T022：实现后台标签路由 routes/admin-tags.js
**复杂度**：S
**依赖**：T014, T003
**涉及文件**：`lib/routes/admin-tags.js`
**完成标准**：
- [ ] `GET /v1/admin/tags` — 列表
- [ ] `POST /v1/admin/tags` — 创建
- [ ] `PUT /v1/admin/tags/:id` — 更新
- [ ] `DELETE /v1/admin/tags/:id` — 删除（级联移除tag_ids）
- [ ] 挂载到 Express app

---

### T023：实现后台配置路由 routes/admin-config.js
**复杂度**：S
**依赖**：T015, T003
**涉及文件**：`lib/routes/admin-config.js`
**完成标准**：
- [ ] `GET /v1/admin/config/site-info` — 读取
- [ ] `PUT /v1/admin/config/site-info` — 批量更新
- [ ] `PUT /v1/admin/config/about` — 更新关于页
- [ ] 挂载到 Express app

---

### T024：实现图片上传服务 image-service.js
**复杂度**：M
**依赖**：T003
**涉及文件**：`lib/services/image-service.js`
**完成标准**：
- [ ] `uploadImage(file, env)` — 调用 Gitee Contents API
- [ ] 格式校验：jpg/jpeg/png/gif/webp，不支持→code=40003
- [ ] 大小校验：≤5MB，超限→code=40002
- [ ] 上传调用：POST https://gitee.com/api/v5/repos/{owner}/{repo}/contents/{path}
- [ ] 超时：30秒
- [ ] 上传失败→code=50002（不抛异常返回500）
- [ ] 返回 URL：`https://gitee.com/{owner}/{repo}/raw/{branch}/{path}`
- [ ] 配置从 context.env 读取（GITEE_TOKEN/OWNER/NAME/BRANCH/IMAGE_PATH）
- [ ] 单元测试通过（mock fetch）

---

### T025：实现图片上传路由 routes/admin-images.js
**复杂度**：S
**依赖**：T024, T003
**涉及文件**：`lib/routes/admin-images.js`
**完成标准**：
- [ ] `POST /v1/admin/images/upload` — multipart/form-data 解析
- [ ] 提取 file 字段
- [ ] 调用 imageService.uploadImage
- [ ] 返回 `{code:200, data:{url}}`
- [ ] 挂载到 Express app

---

### T026：实现仪表盘路由 routes/admin-dashboard.js
**复杂度**：S
**依赖**：T012, T013, T014, T003
**涉及文件**：`lib/routes/admin-dashboard.js`
**完成标准**：
- [ ] `GET /v1/admin/dashboard` — 返回统计 + 最近5篇
- [ ] article_count/published_count/draft_count 从索引统计
- [ ] category_count/tag_count 从 list 长度
- [ ] recent_articles 从 getRecentArticles(5)
- [ ] 挂载到 Express app

---

### T027：创建 .env.example
**复杂度**：S
**依赖**：无
**涉及文件**：`.env.example`
**完成标准**：
- [ ] 包含全部环境变量（JWT_SECRET, JWT_EXPIRE_HOURS, ADMIN_USERNAME, ADMIN_PASSWORD, GITEE_*）
- [ ] 带注释说明每个变量用途

---

### T028：集成所有路由到 [[default]].js
**复杂度**：M
**依赖**：T010, T016, T017, T020, T021, T022, T023, T025, T026
**涉及文件**：`cloud-functions/api/[[default]].js`（扩展）
**完成标准**：
- [ ] 挂载前台路由（/v1/articles, /v1/categories, /v1/tags, /v1/config）
- [ ] 挂载认证中间件（/v1/admin/*）
- [ ] 挂载后台路由（/v1/admin/articles, /v1/admin/categories, ...）
- [ ] 挂载登录路由（/v1/auth/login，在认证中间件之前）
- [ ] 健康检查路由保留
- [ ] 环境变量通过 context.env 传递给服务层

---

### T029：复制前端代码并配置
**复杂度**：M
**依赖**：无（可与后端任务并行）
**涉及文件**：`src/frontend/` 全部文件
**完成标准**：
- [ ] 从 D:\CODES\AICodeStudy\blog\src\frontend\ 复制到 Blog_Edge\src\frontend\
- [ ] 修改 vite.config.js 的 dev proxy 指向 http://127.0.0.1:8088
- [ ] 确认 .env 中 VITE_API_BASE_URL=/api/v1
- [ ] 前端构建验证 `pnpm install && pnpm build` 成功

---

### T030：创建 middleware.js（SPA fallback）
**复杂度**：S
**依赖**：无
**涉及文件**：`middleware.js`
**完成标准**：
- [ ] /api/* 请求放行
- [ ] 有文件扩展名的请求放行
- [ ] 其余请求 rewrite 到 /index.html

---

### T031：EdgeOne 部署与验证
**复杂度**：M
**依赖**：T028, T029, T030
**涉及文件**：全部
**完成标准**：
- [ ] EdgeOne CLI 安装（>= 1.6.0）
- [ ] `edgeone login`（浏览器登录）
- [ ] `edgeone makers dev -n blog-edge` 本地验证
- [ ] `edgeone makers deploy -n blog-edge --json` 部署
- [ ] 前台页面可访问
- [ ] 后台登录可用
- [ ] 文章CRUD全流程
- [ ] 图片上传正常

---

### T032：全量测试与收尾
**复杂度**：M
**依赖**：T031
**涉及文件**：`tests/`
**完成标准**：
- [ ] 全部单元测试通过
- [ ] 集成测试通过
- [ ] 浏览器验证17个页面功能
- [ ] 生成交接文档

---

## 执行顺序

```
T001 → T002 ──────────────────────────────────────→ T028（集成）
T001 → T005 → T006 → T007 → T008 → T009 → T010 ──→ T028
T001 → T005 → T012 ──→ T018 → T019 → T020 ────────→ T028
T001 → T005 → T013 ──→ T021 ──────────────────────→ T028
T001 → T005 → T014 ──→ T022 ──────────────────────→ T028
T001 → T005 → T015 ──→ T023 ──────────────────────→ T028
           T011 ──→ T019                           → T028
T024 → T025 ──────────────────────────────────────→ T028
T012,T013,T014 → T026 ────────────────────────────→ T028
T003 → T004 ──────────────────────────────────────→ T028
T027（并行）
T029,T030（并行）───→ T031 → T032
```

**总计**：32个任务（12S + 14M + 6L）