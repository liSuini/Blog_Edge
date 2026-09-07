---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'ad4e84a6-f898-474c-ae1e-119253a05f4e'
  PropagateID: 'ad4e84a6-f898-474c-ae1e-119253a05f4e'
  ReservedCode1: 'f9445507-f115-4da2-a49a-11953a736585'
  ReservedCode2: 'f9445507-f115-4da2-a49a-11953a736585'
---

# 阶段1：头脑风暴 — Blog_Edge 迁移项目

## 项目愿景

将现有个人博客（Vue3 + FastAPI + MySQL，Docker 三容器部署）全站迁移到 EdgeOne Makers 平台，实现全球 CDN 加速 + 自动 HTTPS + 零运维，同时保持全部功能不变。

## 目标用户

- **博主本人**：唯一的后台管理员，通过 `/admin/*` 管理文章、分类、标签、图片、站点配置
- **博客访客**：前端读者，浏览文章、分类、标签、归档、关于页

## 原项目概况

| 维度 | 现状 |
|------|------|
| 前端 | Vue 3.5 + Vite 5.4 + Pinia + Vue Router（History 模式），17 个页面（8 前台 + 9 后台），12 个组件 |
| 后端 | FastAPI + SQLAlchemy async + MySQL，27 个 API 端点（8 公开 + 18 认证 + 1 健康检查） |
| 数据库 | MySQL，6 张表（Admin、Article、ArticleTag、Category、Tag、SiteConfig） |
| 图片 | 端口+适配器模式，GitHub > Gitee > Local > Fake 优先级，当前用 Gitee 图床 |
| 认证 | JWT（HS256），bcrypt 密码哈希，单管理员模式，token 存 localStorage |
| 部署 | Docker Compose 三容器（frontend 8080 / backend 8000 / mysql 3307） |

## 核心功能列表（迁移后须100%保留）

### 前台（7 个页面功能 + 1 个关于页）
1. **首页文章列表**：分页展示已发布文章卡片，支持按分类/标签过滤，卡片封面交替左右
2. **文章详情页**：Markdown 渲染（含 KaTeX 公式、代码高亮、==高亮==标记、防盗链图片）、左侧目录 TOC（折叠/展开 + 滚动高亮）、上下篇导航
3. **分类页**：全部分类卡片 + 分类下文章列表分页
4. **标签页**：标签云 + 标签下文章列表分页，≥5篇标记热门
5. **归档页**：按年/月分组展示所有已发布文章，支持锚点跳转
6. **关于页**：渲染站点关于内容（Markdown）
7. **侧边栏**：作者卡片 + 公告 + 最新5篇文章 + 前6个分类 + 标签云 + 归档概览

### 后台（9 个管理功能）
1. **登录/登出**：JWT 认证，路由守卫保护
2. **仪表盘**：文章/已发布/草稿/分类/标签计数 + 最近5篇文章
3. **文章管理**：列表（筛选+搜索+分页）、新建/编辑（Markdown编辑器）、发布/撤回切换、软删除
4. **分类管理**：CRUD + slug 唯一性校验 + 排序
5. **标签管理**：CRUD + slug 唯一性校验
6. **图片上传**：拖拽/点击上传到 Gitee 图床，5MB限制，返回 CDN URL
7. **关于页编辑**：Markdown 编辑
8. **站点信息编辑**：站名/作者/头像/简介/公告

## 关键技术约束与迁移决策

### 约束1：后端语言必须从 Python → Node.js
- **原因**：EdgeOne Blob SDK（`@edgeone/pages-blob`）仅支持 Node.js 运行时
- **影响**：全部 27 个 API 端点用 Node.js Express Cloud Functions 重写
- **决策**：采用 Express 框架 + `[[default]].js` 统一入口方案，文件系统路由

### 约束2：无关系型数据库 → Blob Storage 键值建模
- **原6张表 → Blob 键值方案**：
  - `articles/<id>.json` — 每篇文章一个 JSON 文件（含 tag_ids 数组、category_id、status、is_deleted 等）
  - `tags/<id>.json` — 每个标签一个 JSON 文件
  - `categories/<id>.json` — 每个分类一个 JSON 文件
  - `config/site.json` — 站点配置（单 JSON 文档，低并发读写）
  - `config/about.json` — 关于页内容
  - `admin/credentials.json` — 管理员凭证（单文档）
  - `index/articles.json` — 文章索引（id、title、status、published_at、category_id、tag_ids），用于列表分页避免全量读取

### 约束3：无 Redis → 认证用 JWT 无状态方案
- **决策**：JWT 存 localStorage + EdgeOne Middleware 校验 Authorization 头
- 密码哈希用 Node.js `bcrypt` 库
- 无需 refresh token / 黑名单机制（单管理员，简单场景）

### 约束4：请求体上限 6MB
- 图片上传限制从 5MB 保持不变（在 6MB 限制内）
- 但图床走 Gitee API，Cloud Function 仅做中转，实际文件不存 Blob

### 约束5：Cloud Function 冷启动
- 侧边栏当前并行调 4 个 API → 考虑合并为聚合端点减少冷启动影响
- 文章列表用索引文件而非全量扫描

### 约束6：参数校验异常返回 HTTP 200
- 原项目有意设计：所有业务错误（包括参数校验）返回 HTTP 200 + `{code, message, data}`
- 迁移后必须保持此行为，前端统一靠 `code` 字段判断

## 关键业务逻辑迁移要点

| 逻辑 | 原实现 | 迁移方案 |
|------|--------|----------|
| Markdown 摘要自动生成 | Python 正则去 Markdown 语法取前200字 | Node.js 正则重写，逻辑一致 |
| 上下篇导航 | SQL `published_at` 前后查询 | 索引文件中按 `published_at` 排序，内存查找 |
| 归档分组 | SQL `GROUP BY year, month` | 内存中按 `published_at` 聚合分组 |
| 分页 | SQL `OFFSET/LIMIT` | 内存分页（索引文件全量读取后切片） |
| 分类/标签文章计数 | SQL 子查询 + JOIN | 索引文件中遍历统计 |
| 软删除 | `is_deleted` 字段 | JSON 中保留 `is_deleted` 字段 |
| slug 唯一性校验 | SQL UNIQUE 约束 | 标签/分类列表全量加载后唯一性检查 |
| 发布时间首次写入 | `draft→published` 时写 `published_at` | 同逻辑，Cloud Function 中处理 |

## 开放问题

1. ~~是否需要迁移现有 MySQL 数据？~~ → 已确认：从零开始，不迁移
2. ~~是否新增功能？~~ → 已确认：纯功能复刻
3. EdgeOne 项目名称用什么？ → 建议用 `blog-edge`
4. JWT 密钥是否沿用原项目的还是重新生成？ → 重新生成更安全
5. 管理员账号密码是否沿用（Mist / lmw.19990228）？ → 待确认

## 技术栈选型

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router | 直接复用原前端代码，仅调整 API base URL 配置 |
| 后端 | Node.js v20 + Express | Cloud Functions，`[[default]].js` 统一入口 |
| 存储 | EdgeOne Blob Storage | `@edgeone/pages-blob` SDK，consistency: "strong" |
| 认证 | JWT + EdgeOne Middleware | HS256，bcrypt 哈希，Bearer Token |
| 图片 | Gitee/GitHub 图床 API | Cloud Function 中转，不依赖平台存储 |
| 部署 | EdgeOne Makers CLI | `edgeone makers deploy`，全球 CDN + 自动 HTTPS |

## 核心价值主张

- **零运维**：告别 Docker 容器管理、MySQL 备份、Nginx 配置
- **全球加速**：EdgeOne CDN 边缘节点缓存，访客就近访问
- **自动 HTTPS**：无需手动申请/续期证书
- **成本可控**：EdgeOne 免费额度覆盖个人博客（1GB Blob 存储 + 充足请求量）