---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '2e6f9c86-7f34-4d4a-bb3c-9fae6fa74639'
  PropagateID: '2e6f9c86-7f34-4d4a-bb3c-9fae6fa74639'
  ReservedCode1: '386d5485-0e49-442b-ae55-0b5b63321236'
  ReservedCode2: '386d5485-0e49-442b-ae55-0b5b63321236'
---

# 阶段7：开发计划 — Blog_Edge

## 1. 里程碑

| 里程碑 | 名称 | 完成标志 | 预估 |
|--------|------|----------|------|
| M1 | 项目骨架与基础设施 | Express 入口可启动、Blob 初始化、统一响应/错误处理就绪 | 基础 |
| M2 | 认证系统 | 登录API + JWT中间件 + 管理员初始化 | 核心 |
| M3 | 前台API | 文章列表/详情/归档 + 分类/标签列表 + 站点配置读取 | 核心 |
| M4 | 后台文章CRUD | 文章创建/编辑/删除/状态切换 + 索引维护 | 核心 |
| M5 | 后台分类标签CRUD | 分类/标签管理 + 级联处理 | 核心 |
| M6 | 后台配置与图片 | 站点配置管理 + 关于页 + 图片上传 + 仪表盘 | 核心 |
| M7 | 前端集成与部署 | 前端代码复用 + middleware.js + EdgeOne部署验证 | 集成 |
| M8 | 全量测试与交付 | 测试通过 + 浏览器验证全流程 | 收尾 |

## 2. 开发阶段划分

### 阶段A：项目初始化（M1）
**目标**：搭建可运行的项目骨架
1. 创建 `package.json`（依赖、scripts）
2. 创建 `cloud-functions/api/[[default]].js`（Express 入口）
3. 实现 `lib/middleware/response.js`（统一响应工具）
4. 实现 `lib/middleware/error-handler.js`（错误处理）
5. 实现 `lib/repositories/blob-store.js`（Blob Store 初始化封装）
6. 实现 `lib/repositories/id-counter.js`（ID计数器）
7. 健康检查端点 `GET /v1/health`
8. `.env.example` 环境变量模板

**依赖**：无
**完成标志**：`edgeone makers dev` 可启动，`GET /api/v1/health` 返回 `{status:"ok"}`

### 阶段B：认证系统（M2）
**目标**：管理员可登录获取 JWT Token
1. 实现 `lib/repositories/admin-repo.js`（凭证读写 + 首次初始化）
2. 实现 `lib/services/auth-service.js`（bcrypt验证 + JWT签发/验证）
3. 实现 `lib/middleware/auth.js`（Express 认证中间件）
4. 实现路由 `POST /v1/auth/login`
5. 单元测试：auth-service（密码验证、JWT签发/验证）
6. 单元测试：admin-repo初始化逻辑

**依赖**：阶段A
**完成标志**：登录返回 token，无 token 访问 admin 端点返回 401

### 阶段C：前台API（M3）
**目标**：前台7个公开GET端点全部可用
1. 实现 `lib/repositories/article-repo.js`（核心仓储：索引读+文章读+关联填充）
2. 实现 `lib/repositories/category-repo.js`（分类CRUD + 列表+计数）
3. 实现 `lib/repositories/tag-repo.js`（标签CRUD + 列表+计数）
4. 实现 `lib/repositories/config-repo.js`（站点配置+关于页读写）
5. 实现 `lib/utils/markdown.js`（Markdown摘要生成）
6. 实现路由 `routes/articles.js`（列表/详情/归档）
7. 实现路由 `routes/categories.js`
8. 实现路由 `routes/tags.js`
9. 实现路由 `routes/config.js`
10. 单元测试：markdown摘要生成
11. 单元测试：article-repo（列表过滤、分页、归档、上下篇）
12. 集成测试：前台API端到端

**依赖**：阶段A
**完成标志**：7个前台GET端点返回正确格式数据

### 阶段D：后台文章CRUD（M4）
**目标**：文章后台管理全流程可用
1. 扩展 `article-repo.js`（create/update/softDelete/updateStatus + 索引写维护）
2. 实现 `lib/services/article-service.js`（摘要生成调用 + 状态切换逻辑）
3. 实现路由 `routes/admin-articles.js`（列表/创建/编辑/删除/状态切换）
4. 单元测试：article-repo 写操作（创建同步索引、更新同步索引、软删除同步索引）
5. 单元测试：article-service（摘要自动生成、published_at首次写入）
6. 集成测试：后台文章CRUD全流程

**依赖**：阶段B（认证）、阶段C（article-repo基础）
**完成标志**：创建→编辑→发布→删除全流程，索引文件同步

### 阶段E：后台分类标签CRUD（M5）
**目标**：分类和标签管理可用，级联处理正确
1. 扩展 `category-repo.js`（create/update/delete + 唯一性校验 + 删除级联）
2. 扩展 `tag-repo.js`（create/update/delete + 唯一性校验 + 删除级联）
3. 实现路由 `routes/admin-categories.js`
4. 实现路由 `routes/admin-tags.js`
5. 单元测试：category-repo（唯一性冲突、删除级联置null）
6. 单元测试：tag-repo（唯一性冲突、删除级联移除tag_ids）

**依赖**：阶段D（article-repo需要被分类/标签级联更新）
**完成标志**：分类/标签CRUD + 删除级联文章更新正确

### 阶段F：后台配置与图片（M6）
**目标**：配置管理、图片上传、仪表盘可用
1. 扩展 `config-repo.js`（site-info批量更新 + about更新）
2. 实现 `lib/services/image-service.js`（Gitee API适配器）
3. 实现路由 `routes/admin-config.js`（site-info读写 + about更新）
4. 实现路由 `routes/admin-images.js`（图片上传）
5. 实现路由 `routes/admin-dashboard.js`（统计数据）
6. 单元测试：image-service（格式校验、大小校验、错误码映射）
7. 单元测试：config-repo（默认值填充、批量更新）

**依赖**：阶段C（config-repo基础）、阶段B（认证）
**完成标志**：配置更新生效、图片上传返回URL、仪表盘统计正确

### 阶段G：前端集成与部署（M7）
**目标**：前端部署到 EdgeOne 且全流程可用
1. 复制原前端代码到 `src/frontend/`
2. 修改 `vite.config.js`（dev proxy 指向 EdgeOne dev server）
3. 创建 `middleware.js`（SPA fallback）
4. 前端构建 `vite build` → `dist/`
5. EdgeOne CLI 登录 + 项目关联
6. 首次部署 `edgeone makers deploy -n blog-edge`
7. 浏览器验证全流程（前台浏览 + 后台登录管理）

**依赖**：阶段D、E、F全部完成
**完成标志**：EdgeOne URL 可访问，前后端联调正常

### 阶段H：全量测试与交付（M8）
**目标**：全部测试通过，文档齐全
1. 运行全部单元测试 + 集成测试
2. 浏览器手动验证所有17个页面功能
3. 修复回归问题
4. 生成交接文档

**依赖**：阶段G
**完成标志**：测试全绿 + 浏览器验证通过

## 3. 任务依赖关系图

```
A（骨架） ──→ B（认证） ──→ D（文章CRUD） ──→ E（分类标签CRUD） ──→ G（前端集成） ──→ H（测试交付）
     │                              ↑
     └──→ C（前台API） ─────────────┘
              │
              └──→ F（配置图片仪表盘） ──→ G
```

## 4. 优先级排序理由

1. **基础设施先行**（A）：所有模块依赖 Blob Store 和统一响应格式
2. **认证优先于后台**（B先于D/E/F）：后台所有端点需要认证中间件
3. **前台API与认证可并行**（B和C并行）：两者都只依赖A
4. **文章CRUD先于分类标签CRUD**（D先于E）：分类标签删除需要级联更新文章
5. **配置图片仪表盘最后**（F）：逻辑简单但依赖前面的仓储层
6. **前端集成在所有API就绪后**（G）：需要完整后端才能联调
7. **测试交付最后**（H）：全量验证

## 5. 风险点与缓解措施

| 风险 | 缓解措施 |
|------|----------|
| EdgeOne CLI 未安装 | 阶段A首步安装 `npm install -g edgeone@latest` |
| Blob SDK 在 dev server 中的行为与线上不一致 | 阶段G部署后重新验证关键路径 |
| Express 路由前缀映射不确定 | 在阶段A的 health 端点验证路径映射 |
| `lib/` 目录不被 Cloud Function 打包 | 确认 EdgeOne 构建是否包含 `cloud-functions/` 之外的文件，必要时将 lib/ 移入 cloud-functions/ |
| 前端 SPA fallback 配置不生效 | middleware.js 中明确处理有/无扩展名的请求 |
| bcrypt 在 EdgeOne 运行时不可用 | 准备备选方案：用 Node.js 内置 `crypto.scryptSync` 替代 |