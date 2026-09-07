---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '24c907f4-2421-45f2-a55b-3cb011ef7706'
  PropagateID: '24c907f4-2421-45f2-a55b-3cb011ef7706'
  ReservedCode1: '8ae38f9f-5703-4b0d-8e23-31ce6d190b0a'
  ReservedCode2: '8ae38f9f-5703-4b0d-8e23-31ce6d190b0a'
---

# Blog_Edge 项目交接文档

## 1. 项目概述

将个人博客（原 Vue3 + FastAPI + MySQL + Docker 三容器架构）全站迁移到 EdgeOne Makers 平台。

- **项目路径**：`D:\CODES\AICodeStudy\Blog_Edge\`
- **GitHub 仓库**：`git@github.com:liSuini/Blog_Edge.git`（main 分支）
- **原项目参考**：`D:\CODES\AICodeStudy\blog\`

## 2. 技术架构变更

| 维度 | 原项目 | EdgeOne 版本 |
|------|--------|-------------|
| 后端语言 | Python (FastAPI) | JavaScript (Node.js Express) |
| 数据库 | MySQL (6 张关系表) | EdgeOne Blob Storage (键值存储) |
| 认证 | JWT (HS256) + bcrypt | JWT (HS256) + bcryptjs |
| 部署方式 | Docker 三容器 (8080/8000/3307) | EdgeOne Makers (零服务器) |
| 图片存储 | Gitee 图床 | Gitee 图床（保留不变） |
| 前端 | Vue 3 + Vite + Pinia | Vue 3 + Vite + Pinia（代码直接复用） |

## 3. EdgeOne 部署信息

- **项目名**：`blog-edge`
- **Project ID**：`makers-virsawwbt2vw`
- **账号 ID**：100052333456
- **部署 URL**：`https://blog-edge-a8vxxxke.edgeone.cool`（需附带 `eo_token` 和 `eo_time` query string）
- **控制台 URL**：`https://console.cloud.tencent.com/edgeone/makers/project/makers-virsawwbt2vw/setting`
- **最新部署 ID**：`dpt838rfmykq`（2026-09-07 部署，含图片上传 base64 修复 + 页脚文案更新）
- **Node.js 版本**：22.11.0
- **函数地域**：ap-guangzhou（广州）
- **部署命令**：`$env:PAGES_SOURCE="skills"; npx edgeone makers deploy -n blog-edge --json`

## 4. 环境变量配置

9 个环境变量已在 EdgeOne 控制台手动配置（生效范围：全部环境）：

| 变量名 | 用途 |
|--------|------|
| JWT_SECRET | JWT 签发密钥 |
| JWT_EXPIRE_HOURS | JWT 过期时间（小时） |
| ADMIN_USERNAME | 管理员用户名 |
| ADMIN_PASSWORD | 管理员密码 |
| GITEE_TOKEN | Gitee 图床 API Token |
| GITEE_REPO_OWNER | Gitee 图床仓库所有者 |
| GITEE_REPO_NAME | Gitee 图床仓库名 |
| GITEE_BRANCH | Gitee 图床仓库分支 |
| GITEE_IMAGE_PATH | Gitee 图床图片路径 |

## 5. Blob Storage 数据模型

统一 Store 名称：`blog-data`，consistency: `strong`

```
index/
  articles.json        # 文章索引数组（列表/统计/归档/上下篇）
  counters.json        # ID 自增计数器 {article, category, tag}
articles/
  1.json               # 文章完整数据
  2.json
categories/
  1.json               # 分类数据
tags/
  1.json               # 标签数据
config/
  site-info.json       # 站点信息
  about.json           # 关于页内容
```

- 文章索引替代多表 JOIN 查询
- `tag_ids` 数组替代多对多关联表
- `listKeys()` 使用 Blob SDK 的 `list({prefix})` 方法，返回格式为 `{blobs: [{key, etag}]}`

## 6. API 端点清单（27 个）

### 公开 API（8 个）
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/v1/health | 健康检查 |
| POST | /api/v1/auth/login | 管理员登录 |
| GET | /api/v1/articles | 文章分页列表 |
| GET | /api/v1/articles/:id | 文章详情（含上下篇） |
| GET | /api/v1/categories | 分类列表（含文章数） |
| GET | /api/v1/tags | 标签列表（含文章数） |
| GET | /api/v1/config/about | 关于页内容 |
| GET | /api/v1/config/site-info | 站点信息 |

### 后台 API（需 JWT 认证，19 个）
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/v1/admin/articles | 后台文章列表 |
| POST | /api/v1/admin/articles | 创建文章 |
| PUT | /api/v1/admin/articles/:id | 更新文章 |
| DELETE | /api/v1/admin/articles/:id | 软删除文章 |
| PATCH | /api/v1/admin/articles/:id/status | 切换文章状态 |
| GET | /api/v1/admin/categories | 后台分类列表 |
| POST | /api/v1/admin/categories | 创建分类 |
| PUT | /api/v1/admin/categories/:id | 更新分类 |
| DELETE | /api/v1/admin/categories/:id | 删除分类 |
| GET | /api/v1/admin/tags | 后台标签列表 |
| POST | /api/v1/admin/tags | 创建标签 |
| PUT | /api/v1/admin/tags/:id | 更新标签 |
| DELETE | /api/v1/admin/tags/:id | 删除标签 |
| GET | /api/v1/admin/dashboard | 仪表盘统计 |
| POST | /api/v1/admin/images/upload | 图片上传到 Gitee |
| GET | /api/v1/admin/config/about | 获取关于页（后台） |
| PUT | /api/v1/admin/config/about | 更新关于页 |
| GET | /api/v1/admin/config/site-info | 获取站点信息（后台） |
| PUT | /api/v1/admin/config/site-info | 更新站点信息 |

## 7. 功能验证结果

### API 验证（全部通过）
- 认证：登录成功签发 JWT Token
- 文章 CRUD：创建/列表/详情/更新/状态切换/软删除 全部正常
- 分类 CRUD：创建/列表/更新/删除 全部正常
- 标签 CRUD：创建/列表/更新/删除 全部正常
- 仪表盘统计：文章数/已发布数/草稿数/分类数/标签数/最近文章 全部正确
- 站点配置：获取/更新站点信息、关于页 全部正常
- 公开 API：文章列表、分类列表（含文章数）、标签列表（含文章数） 全部正常

### 前端验证
- 首页：文章卡片列表展示正常，侧边栏（博主信息/最新文章/分类/标签/归档）正常
- 后台登录：用户名密码登录成功，跳转到管理后台
- 后台仪表盘：统计卡片 + 最近文章列表正常显示
- 导航菜单：文章管理/分类管理/标签管理/图片上传/关于页/站点信息 全部可访问

### 已知限制
- EdgeOne 预览部署 URL 需附带 `eo_token` 和 `eo_time` query string（绑定自定义域名后可去除）
- `process.env` 在 EdgeOne Express 模式下可正常工作（已验证）
- Blob Store `list()` 返回 `{blobs: [{key, etag}], directories: [...]}` 格式

## 8. 关键文件结构

```
Blog_Edge/
  cloud-functions/
    api/
      [[default]].js        # Express 单入口（处理 /api/* 请求）
  lib/
    middleware/
      auth.js               # JWT 认证中间件
      response.js           # 统一响应格式
      error-handler.js      # 错误处理
    routes/
      auth.js               # 认证路由
      articles.js           # 前台文章路由
      categories.js         # 前台分类路由
      tags.js               # 前台标签路由
      config.js             # 前台配置路由
      admin-articles.js     # 后台文章路由
      admin-categories.js   # 后台分类路由
      admin-tags.js         # 后台标签路由
      admin-config.js       # 后台配置路由
      admin-dashboard.js    # 仪表盘路由
      admin-images.js       # 图片上传路由
    services/
      auth-service.js       # 认证业务逻辑
      article-service.js    # 文章业务逻辑
    repositories/
      blob-store.js         # Blob Store 封装（getJSON/setJSON/listKeys/delKey）
      article-repo.js       # 文章仓储（530 行，CRUD + 索引维护）
      category-repo.js      # 分类仓储
      tag-repo.js           # 标签仓储
      config-repo.js        # 配置仓储
      admin-repo.js         # 管理员仓储
      id-counter.js         # ID 自增计数器
    utils/
      markdown.js           # Markdown 摘要生成
  src/frontend/             # Vue 3 前端源码（从原项目复用）
  middleware.js             # EdgeOne 边缘中间件（SPA fallback）
  package.json
  .edgeone/project.json     # EdgeOne 项目配置
```

## 9. 开发与部署命令

```bash
# 本地开发
npx edgeone makers dev -n blog-edge

# 构建
npm run build

# 部署到 EdgeOne
$env:PAGES_SOURCE="skills"; npx edgeone makers deploy -n blog-edge --json

# 环境变量管理（CLI 方式不生效，需在控制台 UI 配置）
# 控制台：https://console.cloud.tencent.com/edgeone/makers/project/makers-virsawwbt2vw/setting
```

## 10. 迁移过程踩坑记录

1. **bcrypt 原生模块不兼容**：EdgeOne 用 esbuild 打包，bcrypt 的 node-pre-gyp 依赖无法编译。改用纯 JS 实现的 `bcryptjs`。

2. **Blob list() 返回格式**：SDK 文档不明确，实际返回 `{blobs: [{key, etag}], directories: [...]}` 而非 `{keys: [...]}`。`listKeys()` 函数已修复适配。

3. **CLI 环境变量设置静默失败**：`npx edgeone makers env set KEY VALUE` 命令 exit 0 但无输出，环境变量实际未设置。需在控制台 UI 手动配置。

4. **Express 路由前缀**：EdgeOne 平台自动去除 `/api` 前缀，Express 路由写 `/v1/articles` 而非 `/api/v1/articles`。

5. **`process.env` 可用性**：EdgeOne 文档要求用 `context.env`，但 Express 模式下 `process.env` 同样可用（已验证）。

6. **预览 URL 重定向**：POST 请求首次访问会 302 重定向（丢失 body）。正确做法：第一次 POST 触发 302 设置 cookie → 第二次 POST（不带 query string，由 cookie 携带认证）正常处理。

7. **图片上传 multipart 不可用**：EdgeOne Cloud Functions 无 multipart 解析器（multer 等依赖在 esbuild 打包后不工作）。改用前端 FileReader → base64 JSON 方式上传，后端 `Buffer.from(content, "base64")` 解码。

## 11. 后续待办

- [ ] 绑定自定义域名（去除 `eo_token` query string 依赖）
- [x] 图片上传功能端到端验证（已通过：base64 JSON 上传 → Gitee 图床 → URL 可访问）
- [ ] 原项目历史数据迁移（当前为空库从零开始）
- [x] 页脚文案 "Powered by FastAPI + Vue3" 更新为 "Powered by EdgeOne + Vue3"