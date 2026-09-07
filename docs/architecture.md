---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'fcd8c26d-8478-43e3-a803-e32cfe5a2f5d'
  PropagateID: 'fcd8c26d-8478-43e3-a803-e32cfe5a2f5d'
  ReservedCode1: 'd7e7a4cf-b757-4a6b-9f79-689e0d6c2e3c'
  ReservedCode2: 'd7e7a4cf-b757-4a6b-9f79-689e0d6c2e3c'
---

# 阶段4：架构设计 — Blog_Edge

## 1. 技术栈选型

| 层 | 技术 | 版本 | 说明 |
|----|------|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router | 3.5 / 5.4 / 2.2 / 4.4 | 直接复用原前端代码 |
| 后端 | Node.js + Express | v20.x / 4.x | Cloud Functions，Express 框架 |
| 存储 | EdgeOne Blob Storage | @edgeone/pages-blob ^0.0.14 | consistency: "strong" |
| 认证 | jsonwebtoken + bcrypt | ^9.0 / ^5.0 | JWT 签发 + bcrypt 哈希 |
| 图片上传 | undici (fetch) | Node.js 内置 | Gitee Contents API 调用 |
| 部署 | EdgeOne Makers CLI | >= 1.6.0 | `edgeone makers deploy` |

## 2. 设计两遍法（Design It Twice）

### 方案A：Express 单入口 + 路由分发

```
cloud-functions/api/[[default]].js  ← Express app, 处理所有 /api/*
├── /api/v1/auth/login
├── /api/v1/articles/*
├── /api/v1/categories
├── /api/v1/tags
├── /api/v1/config/*
├── /api/v1/admin/articles/*
├── /api/v1/admin/categories/*
├── /api/v1/admin/tags/*
├── /api/v1/admin/config/*
├── /api/v1/admin/dashboard
├── /api/v1/admin/images/upload
└── /api/v1/health
```

**优点**：
- 单一 Cloud Function 入口，部署简单
- Express 中间件链统一处理 CORS、JSON解析、错误处理
- JWT 认证可用 Express 中间件（`app.use('/api/v1/admin', authMiddleware)`）
- 所有路由在同一个文件中，逻辑集中

**缺点**：
- 单文件可能较长（27个端点），需按模块拆分路由文件
- 所有请求共享一个冷启动实例

### 方案B：文件系统路由（一文件一端点）

```
cloud-functions/api/
├── auth/login.js         → POST /api/v1/auth/login
├── articles/index.js     → GET /api/v1/articles
├── articles/[id].js      → GET /api/v1/articles/:id
├── articles/archive.js   → GET /api/v1/articles/archive
├── categories/index.js   → GET /api/v1/categories
├── ...
```

**优点**：
- 每个端点独立 Cloud Function，按需冷启动
- 文件即路由，结构清晰

**缺点**：
- 27个独立函数文件，维护成本高
- 共享逻辑（Blob 初始化、错误处理、响应格式）需在每个文件重复或抽公共模块
- JWT 认证需要 EdgeOne Middleware 配合（每个 admin 端点都经过中间件）
- Blob Store 初始化无法跨函数共享

### 决策：选择方案A（Express 单入口）

**理由**：
1. 27 个端点共享大量公共逻辑（Blob 初始化、统一响应、错误处理），Express 中间件链自然复用
2. 单入口冷启动一次，后续请求无冷启动延迟（在 wall clock 120秒内）
3. 路由按模块拆分为独立文件（`routes/articles.js` 等），通过 Express Router 挂载，兼顾可维护性
4. JWT 认证用 Express 中间件比 EdgeOne Middleware 更灵活（可读取请求体、注入用户信息）
5. 图片上传需要 multipart 解析，Express 中间件处理更统一

> **关于 EdgeOne Middleware**：仍用于 SPA fallback（非 `/api/*` 请求返回 `index.html`），但 JWT 认证改在 Express 中间件中实现。这样认证逻辑与业务逻辑在同一运行时内，无需跨层传递。

## 3. 目录结构

```
Blog_Edge/
├── docs/                          # 阶段文档
│   ├── brainstorm.md
│   ├── prd.md
│   ├── domain.md
│   ├── architecture.md            # 本文件
│   ├── spec.md
│   ├── plan.md
│   └── tickets.md
├── cloud-functions/               # EdgeOne Cloud Functions
│   └── api/
│       └── [[default]].js         # Express 入口（所有 /api/* 路由）
├── lib/                           # 后端业务逻辑（被 Cloud Function 引用）
│   ├── routes/                    # 路由模块
│   │   ├── auth.js                # 认证路由
│   │   ├── articles.js            # 前台文章路由
│   │   ├── categories.js          # 前台分类路由
│   │   ├── tags.js                # 前台标签路由
│   │   ├── config.js              # 前台配置路由
│   │   ├── admin-articles.js      # 后台文章路由
│   │   ├── admin-categories.js    # 后台分类路由
│   │   ├── admin-tags.js          # 后台标签路由
│   │   ├── admin-config.js        # 后台配置路由
│   │   ├── admin-dashboard.js     # 仪表盘路由
│   │   └── admin-images.js        # 图片上传路由
│   ├── repositories/              # 深模块：Blob 存储访问层
│   │   ├── blob-store.js          # Blob Store 初始化（getStore 封装）
│   │   ├── id-counter.js          # ID 自增计数器
│   │   ├── article-repo.js        # 文章仓储（CRUD + 索引维护）
│   │   ├── category-repo.js       # 分类仓储
│   │   ├── tag-repo.js            # 标签仓储
│   │   ├── config-repo.js         # 配置仓储
│   │   └── admin-repo.js          # 管理员凭证仓储
│   ├── services/                  # 业务逻辑层
│   │   ├── auth-service.js        # JWT 签发/验证 + bcrypt
│   │   ├── article-service.js     # 文章业务逻辑（摘要生成、状态切换等）
│   │   └── image-service.js       # 图片上传适配器
│   ├── middleware/                # Express 中间件
│   │   ├── auth.js                # JWT 认证中间件
│   │   ├── error-handler.js       # 统一错误处理
│   │   └── response.js            # 统一响应格式工具
│   └── utils/                     # 工具函数
│       ├── markdown.js            # Markdown 摘要生成
│       └── validators.js          # 参数校验
├── tests/                         # 测试文件
│   ├── unit/
│   │   ├── markdown.test.js
│   │   ├── auth-service.test.js
│   │   ├── article-service.test.js
│   │   └── image-service.test.js
│   └── integration/
│       └── api.test.js
├── src/                           # 前端源码（从原项目复制）
│   └── frontend/
│       ├── src/
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── .env
├── middleware.js                  # EdgeOne 边缘中间件（SPA fallback）
├── package.json                   # 项目根 package.json
├── edgeone.json                   # EdgeOne 项目配置（自动生成）
├── .env.example                   # 环境变量模板
└── .gitignore
```

## 4. 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP 请求                              │
│              /api/v1/*  或  /* (静态资源)                   │
└──────────┬──────────────────────────────┬────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  EdgeOne middleware  │      │  cloud-functions/api/    │
│  middleware.js       │      │  [[default]].js          │
│  (SPA fallback)      │      │  (Express app)           │
│  非 /api/* → index   │      │                          │
└─────────────────────┘      │  ┌─────────────────────┐ │
                             │  │  Express Middleware  │ │
                             │  │  CORS / JSON / Error │ │
                             │  │  Auth (/admin/*)     │ │
                             │  └────────┬────────────┘ │
                             │           ▼              │
                             │  ┌─────────────────────┐ │
                             │  │   Routes (路由层)     │ │
                             │  │  auth/articles/...   │ │
                             │  │  admin-articles/...  │ │
                             │  └────────┬────────────┘ │
                             │           ▼              │
                             │  ┌─────────────────────┐ │
                             │  │  Services (服务层)    │ │
                             │  │  摘要生成/状态切换    │ │
                             │  │  JWT/密码/图片上传    │ │
                             │  └────────┬────────────┘ │
                             │           ▼              │
                             │  ┌─────────────────────┐ │
                             │  │ Repositories (仓储层) │ │
                             │  │  Blob CRUD + 索引    │ │
                             │  │  ID计数器             │ │
                             │  └────────┬────────────┘ │
                             │           ▼              │
                             │  ┌─────────────────────┐ │
                             │  │  Blob Storage        │ │
                             │  │  @edgeone/pages-blob │ │
                             │  └─────────────────────┘ │
                             └─────────────────────────┘
```

## 5. 深模块设计

### 5.1 Repository 层（深模块 — 核心抽象）

每个 Repository 将 Blob Storage 的键值操作封装为业务语义接口，隐藏键命名方案和索引同步逻辑。

**ArticleRepository 接口**：
```javascript
// 接口（小而精）
class ArticleRepository {
  async getById(id)                    // → Article | null
  async getPublishedById(id)           // → Article (published, not deleted) | null
  async listPublished(opts)            // → {items, total}  opts: {page, size, categorySlug, tagSlug}
  async listAdmin(opts)                // → {items, total}  opts: {page, size, status, keyword, includeDeleted}
  async create(data)                   // → Article  (同时创建文章文件 + 更新索引)
  async update(id, data)               // → Article  (同时更新文章文件 + 更新索引)
  async softDelete(id)                 // → void
  async updateStatus(id, status)       // → Article
  async getArchive()                   // → [ArchiveGroup]
  async getPrevNext(article)           // → {prev, next}
  async countAll()                     // → {total, published, draft}
}
```

**隐藏的复杂度**（实现内部）：
- 文章文件 `articles/<id>.json` 的读写
- 索引文件 `index/articles.json` 的 read-modify-write
- ID 计数器 `index/counters.json` 的自增
- 分类 slug → category_id 的查找（用于分类过滤）
- 标签 slug → tag_id 的查找（用于标签过滤）
- 文章 JSON 中 tag_ids → TagRef[] 的关联填充
- 文章 JSON 中 category_id → CategoryRef 的关联填充
- 软删除标记的过滤

### 5.2 Service 层（薄模块 — 业务规则）

Service 层在 Repository 之上添加业务规则，不直接访问 Blob。

**ArticleService**：
- `createArticle(data)` → 调用摘要生成 + Repository.create
- `updateArticle(id, data)` → 状态切换判断 + Repository.update
- 仅包含需要跨多个 Repository 协调或包含业务规则的逻辑

**AuthService**：
- `login(username, password)` → 从 AdminRepository 读凭证 + bcrypt 验证 + JWT 签发
- `verifyToken(token)` → JWT 验签

**ImageService**：
- `uploadImage(file)` → Gitee API 调用 + 超时处理 + 错误码映射

### 5.3 中间件层

**auth 中间件**（Express）：
```javascript
// 匹配 /api/v1/admin/*（排除 /api/v1/auth/login）
app.use('/api/v1/admin', (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token || !authService.verifyToken(token)) {
    return res.status(401).json({ code: 40101, message: "未认证或Token无效", data: null });
  }
  next();
});
```

**error-handler 中间件**：
```javascript
// 全局兜底：未捕获异常 → HTTP 500 + code:50001
// 参数校验 → HTTP 200 + code:40001（保持原项目设计）
```

## 6. 前端适配

### 6.1 复用策略
- 直接复制原前端 `src/frontend/` 到 `Blog_Edge/src/frontend/`
- **唯一改动**：`vite.config.js` 中 dev proxy 指向 EdgeOne dev server
- **API base URL**：`/api/v1`（保持不变，EdgeOne 路由 /api/* 到 Cloud Function）

### 6.2 构建配置
- `vite build` 输出到 `dist/`
- EdgeOne 自动检测 Vite 框架并构建
- `middleware.js` 处理 SPA fallback（History 模式路由）

### 6.3 EdgeOne middleware.js（SPA fallback）
```javascript
export function middleware(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // API 请求直接放行到 Cloud Function
  if (url.pathname.startsWith('/api/')) {
    return next();
  }
  
  // 有文件扩展名的请求放行（静态资源）
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return next();
  }
  
  // 其余路由返回 index.html（SPA History 模式 fallback）
  return context.rewrite('/index.html');
}
```

## 7. 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT 签名密钥 | （随机字符串） |
| `JWT_EXPIRE_HOURS` | Token 有效期（小时） | `24` |
| `ADMIN_USERNAME` | 管理员用户名 | `Mist` |
| `ADMIN_PASSWORD` | 管理员密码（首次初始化用） | （明文，初始化后转哈希存储） |
| `GITEE_TOKEN` | Gitee API Token | |
| `GITEE_REPO_OWNER` | Gitee 仓库所有者 | `just-u` |
| `GITEE_REPO_NAME` | Gitee 仓库名 | `image-bed` |
| `GITEE_BRANCH` | Gitee 分支 | `master` |
| `GITEE_IMAGE_PATH` | 仓库内图片目录 | `images` |

> 环境变量通过 `context.env` 读取（EdgeOne Cloud Functions 规范），不使用 `process.env`。

## 8. 第三方依赖

### 8.1 后端依赖（package.json）

| 依赖 | 用途 |
|------|------|
| `express` | Web 框架 |
| `@edgeone/pages-blob` | Blob Storage SDK |
| `jsonwebtoken` | JWT 签发/验证 |
| `bcrypt` | 密码哈希 |

### 8.2 开发依赖

| 依赖 | 用途 |
|------|------|
| `vitest` | 测试框架 |
| `supertest` | HTTP 集成测试 |

### 8.3 前端依赖
直接复用原项目 `package.json`，不增不减。

## 9. 关键设计决策总结

| 编号 | 决策 | 理由 |
|------|------|------|
| D1 | Express 单入口 `[[default]].js` | 共享公共逻辑、单冷启动、中间件链复用 |
| D2 | JWT 认证在 Express 中间件 | 灵活读取请求体、注入用户信息，无需跨层 |
| D3 | 文章索引文件 `index/articles.json` | 一次读取完成列表/统计/归档，避免N次Blob读取 |
| D4 | tag_ids 数组替代关联表 | 文章标签关联一次读取获得，简单高效 |
| D5 | 分类/标签直接 list+get | 数据量极小（<20），无需索引文件 |
| D6 | 前端代码直接复用 | 纯迁移，API 路径和格式100%兼容 |
| D7 | middleware.js 仅做 SPA fallback | 认证逻辑全在 Express 中，不在边缘层 |
| D8 | 环境变量通过 context.env 读取 | EdgeOne 平台规范，非 process.env |