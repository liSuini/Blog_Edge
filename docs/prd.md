---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '90bd7917-610c-48c1-a945-f6b89216807a'
  PropagateID: '90bd7917-610c-48c1-a945-f6b89216807a'
  ReservedCode1: '95d80508-546a-4c60-8980-f8b7306a23a7'
  ReservedCode2: '95d80508-546a-4c60-8980-f8b7306a23a7'
---

# PRD：Blog_Edge — 个人博客 EdgeOne Makers 全站迁移

## 1. 概述

将现有个人博客（Vue3 + FastAPI + MySQL，Docker 三容器部署）全站迁移到 EdgeOne Makers 平台。后端从 Python/FastAPI 重写为 Node.js Express Cloud Functions，数据库从 MySQL 迁移到 Blob Storage 键值存储，前端 Vue3 SPA 部署到 EdgeOne CDN。保持全部功能不变，不新增功能，不迁移历史数据（从零开始）。

## 2. 目标

- **功能等价**：27 个 API 端点全部复刻，17 个前端页面零改动复用
- **零运维**：移除 Docker/MySQL/Nginx，部署和运行完全托管的 EdgeOne 平台
- **全球加速**：EdgeOne CDN 边缘节点缓存，访客就近访问
- **自动 HTTPS**：平台自动签发和续期 SSL 证书
- **API 兼容**：保持原 `/api/v1/*` 路径前缀和统一响应格式 `{code, message, data}`，前端仅改 baseURL 配置
- **图片上传不中断**：保留 Gitee 图床适配器，Cloud Function 中转

## 3. 用户故事

### US-001: 管理员登录认证
**描述**：作为博客管理员，我想要通过用户名密码登录获取 JWT Token，以便安全访问后台管理功能。

**验收标准**：
- [ ] `POST /api/v1/auth/login` 接受 `{username, password}` 返回 `{code:200, data:{token}}`
- [ ] 密码用 bcrypt 哈希验证
- [ ] 凭证错误返回 `{code:40101, message:"用户名或密码错误"}`
- [ ] 登出通过前端清除 localStorage token 实现

### US-002: Middleware JWT 认证守卫
**描述**：作为系统，我需要 EdgeOne Middleware 自动校验 `/api/v1/admin/*` 请求的 JWT Token，拒绝未授权访问。

**验收标准**：
- [ ] `middleware.js` 匹配 `/api/v1/admin/*` 路径（排除 `/api/v1/auth/login`）
- [ ] 无 Authorization 头或 token 无效 → 返回 401 + `{code:40101, message:"未认证或Token无效"}`
- [ ] token 有效 → 放行到 Cloud Function
- [ ] 公开端点（`/api/v1/articles/*`、`/api/v1/categories`等）不受中间件影响

### US-003: 前台文章列表分页
**描述**：作为访客，我想要分页浏览已发布文章列表，以便快速了解博客内容。

**验收标准**：
- [ ] `GET /api/v1/articles?page=1&size=10` 返回 `{code:200, data:{items:[...], total, page, size}}`
- [ ] 仅返回 `status=published` 且 `is_deleted=false` 的文章
- [ ] 按 `published_at DESC` 排序
- [ ] 支持 `category_slug` 和 `tag_slug` 查询参数过滤
- [ ] 每篇文章返回 id、title、summary、cover_image_url、category(CategoryRef)、tags([TagRef])、published_at

### US-004: 文章详情页
**描述**：作为访客，我想要查看文章完整内容，以便阅读博客文章。

**验收标准**：
- [ ] `GET /api/v1/articles/:id` 返回完整文章详情（含 content、status、created_at、updated_at）
- [ ] 包含 prev_article 和 next_article（按 published_at 排序的上下篇）
- [ ] 不存在或未发布 → `{code:40401, message:"文章不存在"}`

### US-005: 文章归档
**描述**：作为访客，我想要按年月分组浏览所有已发布文章，以便查找历史文章。

**验收标准**：
- [ ] `GET /api/v1/articles/archive` 返回 `[{year, months:[{month, articles:[{id, title, published_at}]}]}]`
- [ ] 年份倒序，月份倒序
- [ ] 仅含已发布且未删除文章

### US-006: 分类列表与计数
**描述**：作为访客，我想要查看全部分类及各分类下已发布文章数。

**验收标准**：
- [ ] `GET /api/v1/categories` 返回 `[{id, name, slug, sort_order, article_count}]`
- [ ] 按 sort_order, id 排序
- [ ] article_count 仅统计已发布未删除文章

### US-007: 标签列表与计数
**描述**：作为访客，我想要查看全部标签及各标签下已发布文章数。

**验收标准**：
- [ ] `GET /api/v1/tags` 返回 `[{id, name, slug, article_count}]`
- [ ] 按 id 排序
- [ ] article_count 仅统计已发布未删除文章

### US-008: 站点配置读取
**描述**：作为访客，我想要查看站点信息和关于页内容。

**验收标准**：
- [ ] `GET /api/v1/config/site-info` 返回 `{site_name, author_name, author_avatar, author_bio, announcement}`
- [ ] `GET /api/v1/config/about` 返回 `{content}`
- [ ] 缺失配置项使用默认值填充

### US-009: 后台文章 CRUD
**描述**：作为管理员，我想要创建、编辑、删除、发布/撤回文章。

**验收标准**：
- [ ] `POST /api/v1/admin/articles` — 创建，summary 为空时自动截取正文前200字（去Markdown语法）
- [ ] `PUT /api/v1/admin/articles/:id` — 部分更新，tag_ids 传入时先删旧关联再建新
- [ ] `DELETE /api/v1/admin/articles/:id` — 软删除（is_deleted=true）
- [ ] `PATCH /api/v1/admin/articles/:id/status` — 切换状态，draft→published 首次写入 published_at
- [ ] `GET /api/v1/admin/articles?page=&size=&status=&keyword=&include_deleted=` — 后台分页列表
- [ ] 索引文件同步更新（创建/更新/删除文章时同步维护 `index/articles.json`）

### US-010: 后台分类 CRUD
**描述**：作为管理员，我想要管理文章分类。

**验收标准**：
- [ ] `POST /api/v1/admin/categories` — 创建，name/slug 唯一性校验，冲突 `{code:40901}`
- [ ] `PUT /api/v1/admin/categories/:id` — 更新，排除自身的唯一性校验
- [ ] `DELETE /api/v1/admin/categories/:id` — 删除，关联文章的 category_id 置 null
- [ ] `GET /api/v1/admin/categories` — 按 sort_order 排序列表

### US-011: 后台标签 CRUD
**描述**：作为管理员，我想要管理文章标签。

**验收标准**：
- [ ] `POST /api/v1/admin/tags` — 创建，name/slug 唯一性校验，冲突 `{code:40901}`
- [ ] `PUT /api/v1/admin/tags/:id` — 更新，排除自身的唯一性校验
- [ ] `DELETE /api/v1/admin/tags/:id` — 删除，清理文章中关联的 tag_ids
- [ ] `GET /api/v1/admin/tags` — 按 id 排序列表

### US-012: 站点配置管理
**描述**：作为管理员，我想要编辑站点信息和关于页内容。

**验收标准**：
- [ ] `PUT /api/v1/admin/config/site-info` — 批量更新站点信息，返回完整 SiteInfo
- [ ] `GET /api/v1/admin/config/site-info` — 读取当前站点信息
- [ ] `PUT /api/v1/admin/config/about` — 更新关于页内容
- [ ] 配置存为 Blob 单 JSON 文档（`config/site.json`）

### US-013: 图片上传
**描述**：作为管理员，我想要上传图片到图床获取 CDN URL，以便在文章和站点信息中使用。

**验收标准**：
- [ ] `POST /api/v1/admin/images/upload` — 接受 multipart file，限制 ≤5MB
- [ ] 支持格式：jpg/jpeg/png/gif/webp，不支持返回 `{code:40003}`
- [ ] 超大返回 `{code:40002}`
- [ ] 上传到 Gitee 图床（通过环境变量配置 token/owner/repo）
- [ ] 返回 `{code:200, data:{url:"https://gitee.com/..."}}`
- [ ] 上传失败返回 `{code:50002}`，不返回 500

### US-014: 仪表盘
**描述**：作为管理员，我想要查看博客总体统计数据和最近文章。

**验收标准**：
- [ ] `GET /api/v1/admin/dashboard` 返回 `{article_count, published_count, draft_count, category_count, tag_count, recent_articles:[...]}`
- [ ] article_count 统计未删除文章（含草稿）
- [ ] recent_articles 返回最近5篇（按 created_at DESC）

### US-015: 统一响应格式与错误处理
**描述**：作为系统，我需要保持与原后端一致的统一响应格式和错误码体系。

**验收标准**：
- [ ] 所有响应遵循 `{code: int, message: string, data: T|null}` 格式
- [ ] 参数校验错误返回 HTTP 200 + `{code:40001, message:"参数校验错误"}`
- [ ] 认证错误返回 HTTP 401 + `{code:40101}`
- [ ] 资源不存在返回 HTTP 200 + `{code:40401}`
- [ ] 冲突返回 HTTP 200 + `{code:40901}`
- [ ] 内部错误返回 HTTP 500 + `{code:50001}`

### US-016: 前端部署与路由
**描述**：作为系统，我需要将 Vue3 SPA 部署到 EdgeOne CDN 并配置 SPA fallback。

**验收标准**：
- [ ] 前端 `dist/` 目录部署到 EdgeOne
- [ ] History 模式路由 SPA fallback 正确（所有非文件请求返回 index.html）
- [ ] `/api/v1/*` 请求路由到 Cloud Functions
- [ ] 静态资源（JS/CSS/图片/字体）CDN 缓存

### US-017: 健康检查
**描述**：作为系统，我需要一个健康检查端点验证部署状态。

**验收标准**：
- [ ] `GET /api/v1/health` 返回 `{status:"ok"}`
- [ ] 无需认证

## 4. 功能需求

- **FR-1**：系统使用 EdgeOne Blob Storage 作为唯一持久化存储，所有数据以 JSON 文件形式存储
- **FR-2**：Blob Store 创建时必须使用 `consistency: "strong"`
- **FR-3**：后端使用 Node.js Express Cloud Functions，`cloud-functions/api/[[default]].js` 统一入口处理所有 `/api/*` 路由
- **FR-4**：EdgeOne `middleware.js` 守卫所有 `/api/v1/admin/*` 路径（排除登录端点）
- **FR-5**：JWT 使用 HS256 算法，密钥通过 EdgeOne 环境变量注入
- **FR-6**：密码使用 bcrypt 哈希存储
- **FR-7**：文章索引（`index/articles.json`）在文章增删改时同步维护，用于列表查询和统计
- **FR-8**：Markdown 摘要自动生成（正则去除 Markdown 语法后取前200字 + "..."）
- **FR-9**：图片上传通过 Gitee Contents API，超时 30 秒，失败返回业务错误码而非 500
- **FR-10**：参数校验错误返回 HTTP 200（非 422），靠 code 字段区分
- **FR-11**：前端代码直接复用原项目，仅修改 `VITE_API_BASE_URL` 配置
- **FR-12**：管理员凭证和图床配置通过 EdgeOne 环境变量注入（非硬编码）

## 5. 非目标（范围外）

- **不迁移历史数据**：从空数据开始，不导入 MySQL 中的现有文章
- **不新增功能**：不增加评论、搜索、分类层级、多用户等原项目没有的功能
- **不保留 Docker 部署**：完全迁移到 EdgeOne，不维护双部署
- **不使用 LocalImageAdapter**：移除本地图床，仅保留 GitHub/Gitee 适配器
- **不实现 Refresh Token / 黑名单**：单管理员场景，JWT 过期重新登录即可
- **不做 SEO 预渲染**：SPA 客户端渲染，不做 SSR/SSG

## 6. 技术考量

### 原有约束（须保持）
- API 路径前缀 `/api/v1`
- 统一响应格式 `{code, message, data}`
- 错误码体系（200/40001/40002/40003/40101/40401/40901/50001/50002）
- 参数校验错误返回 HTTP 200

### EdgeOne 平台约束
- Blob SDK 仅 Node.js → 后端必须 Node.js
- 请求体上限 6MB → 图片上传 5MB 限制不受影响
- 冷启动 → 侧边栏 4 个 API 合并为 1 个聚合端点
- 无内存状态 → 每次请求从 Blob 读取

### 性能策略
- 文章索引文件（`index/articles.json`）一次读取支持列表/统计/归档/上下篇
- 站点配置用单 JSON 文档（`config/site.json`），一次 get/set
- Blob strong consistency 保证写后立即可读

## 7. 成功指标

- 27 个 API 端点全部复刻并通过测试
- 17 个前端页面功能与原项目一致（视觉零差异）
- 部署到 EdgeOne 后可正常访问（前台浏览 + 后台管理全流程）
- 图片上传到 Gitee 图床正常工作
- API 响应格式与原项目 100% 兼容

## 8. 开放问题

1. EdgeOne 项目名称？建议 `blog-edge`
2. 管理员账号密码是否沿用 Mist / lmw.19990228？
3. Gitee 图床配置是否沿用现有 token 和仓库？