---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '2a3b75ae-600e-4522-a2f9-28f12e908c0b'
  PropagateID: '2a3b75ae-600e-4522-a2f9-28f12e908c0b'
  ReservedCode1: 'eb51f637-9414-4603-8eb0-1b98dd9777d5'
  ReservedCode2: 'eb51f637-9414-4603-8eb0-1b98dd9777d5'
---

# 阶段5：技术规格 — Blog_Edge

## 1. 统一响应格式

### 1.1 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": <T | null>
}
```

### 1.2 错误响应
```json
{
  "code": <ErrorCode>,
  "message": "<错误描述>",
  "data": null
}
```

### 1.3 错误码

| 码 | HTTP Status | 说明 |
|----|-------------|------|
| 200 | 200 | 成功 |
| 40001 | **200** | 参数校验错误 |
| 40002 | 200 | 文件过大 |
| 40003 | 200 | 不支持的图片格式 |
| 40101 | **401** | 未认证或Token无效 |
| 40401 | 200 | 资源不存在 |
| 40901 | 200 | 冲突（name/slug重复） |
| 50001 | **500** | 服务器内部错误 |
| 50002 | 200 | 图片上传失败 |

### 1.4 分页结构
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [<T>],
    "total": 42,
    "page": 1,
    "size": 10
  }
}
```

## 2. Blob 数据模型

### 2.1 Article（`articles/<id>.json`）
```json
{
  "id": 1,
  "title": "文章标题",
  "content": "Markdown正文",
  "summary": "摘要文本",
  "cover_image_url": "https://...",
  "status": "published",
  "is_deleted": false,
  "category_id": 1,
  "tag_ids": [1, 2],
  "created_at": "2026-09-07T09:00:00.000Z",
  "updated_at": "2026-09-07T10:00:00.000Z",
  "published_at": "2026-09-07T10:00:00.000Z"
}
```

### 2.2 Category（`categories/<id>.json`）
```json
{
  "id": 1,
  "name": "技术分享",
  "slug": "tech",
  "sort_order": 0,
  "created_at": "2026-09-07T09:00:00.000Z"
}
```

### 2.3 Tag（`tags/<id>.json`）
```json
{
  "id": 1,
  "name": "Vue",
  "slug": "vue",
  "created_at": "2026-09-07T09:00:00.000Z"
}
```

### 2.4 文章索引（`index/articles.json`）
```json
[
  {
    "id": 1,
    "title": "文章标题",
    "status": "published",
    "is_deleted": false,
    "published_at": "2026-09-07T10:00:00.000Z",
    "category_id": 1,
    "tag_ids": [1, 2],
    "created_at": "2026-09-07T09:00:00.000Z",
    "updated_at": "2026-09-07T10:00:00.000Z"
  }
]
```

### 2.5 计数器（`index/counters.json`）
```json
{
  "article": 0,
  "category": 0,
  "tag": 0
}
```

### 2.6 站点配置（`config/site.json`）
```json
{
  "site_name": "My Blog",
  "author_name": "博主",
  "author_avatar": "",
  "author_bio": "",
  "announcement": ""
}
```

### 2.7 关于页（`config/about.json`）
```json
{
  "content": "关于页Markdown内容"
}
```

### 2.8 管理员凭证（`admin/credentials.json`）
```json
{
  "username": "Mist",
  "password_hash": "$2b$10$..."
}
```

## 3. API 接口规格

### 3.1 认证模块

#### POST /api/v1/auth/login
- **认证**：无
- **请求 Body**：
  ```json
  { "username": "string", "password": "string" }
  ```
- **成功响应** (code=200)：
  ```json
  { "code": 200, "message": "success", "data": { "token": "jwt_token_string" } }
  ```
- **失败响应** (code=40101)：
  ```json
  { "code": 40101, "message": "用户名或密码错误", "data": null }
  ```
- **校验规则**：username 非空，password 非空

---

### 3.2 前台文章模块

#### GET /api/v1/articles
- **认证**：无
- **Query 参数**：

| 参数 | 类型 | 默认值 | 约束 | 说明 |
|------|------|--------|------|------|
| page | int | 1 | ≥1 | 页码 |
| size | int | 10 | 1-50 | 每页条数 |
| category_slug | string | — | 可选 | 分类slug过滤 |
| tag_slug | string | — | 可选 | 标签slug过滤 |

- **响应 data**：`PaginatedData<ArticleCard>`
  ```json
  {
    "items": [{
      "id": 1,
      "title": "标题",
      "summary": "摘要",
      "cover_image_url": "https://...",
      "category": { "id": 1, "name": "技术", "slug": "tech" },
      "tags": [{ "id": 1, "name": "Vue", "slug": "vue" }],
      "published_at": "2026-09-07T10:00:00.000Z"
    }],
    "total": 42,
    "page": 1,
    "size": 10
  }
  ```
- **过滤逻辑**：`status="published" && is_deleted=false`，按 `published_at DESC` 排序

#### GET /api/v1/articles/archive
- **认证**：无
- **响应 data**：`[ArchiveGroup]`
  ```json
  [{
    "year": 2026,
    "months": [{
      "month": 9,
      "articles": [{ "id": 1, "title": "标题", "published_at": "2026-09-07T10:00:00.000Z" }]
    }]
  }]
  ```
- **排序**：年倒序、月倒序

#### GET /api/v1/articles/:id
- **认证**：无
- **Path 参数**：`id` (int)
- **响应 data**：`ArticleDetail`
  ```json
  {
    "id": 1,
    "title": "标题",
    "content": "Markdown正文",
    "summary": "摘要",
    "cover_image_url": "https://...",
    "status": "published",
    "category": { "id": 1, "name": "技术", "slug": "tech" },
    "tags": [{ "id": 1, "name": "Vue", "slug": "vue" }],
    "published_at": "2026-09-07T10:00:00.000Z",
    "created_at": "2026-09-07T09:00:00.000Z",
    "updated_at": "2026-09-07T10:00:00.000Z",
    "prev_article": { "id": 2, "title": "上一篇" },
    "next_article": { "id": 3, "title": "下一篇" }
  }
  ```
- **不存在**：`{ "code": 40401, "message": "文章不存在", "data": null }`
- **过滤**：仅返回 `status="published" && is_deleted=false`

---

### 3.3 前台分类模块

#### GET /api/v1/categories
- **认证**：无
- **响应 data**：`[CategoryWithCount]`
  ```json
  [{
    "id": 1, "name": "技术", "slug": "tech", "sort_order": 0,
    "article_count": 5,
    "created_at": "2026-09-07T09:00:00.000Z"
  }]
  ```
- **排序**：sort_order ASC, id ASC
- **article_count**：仅统计 published && !is_deleted 的文章

---

### 3.4 前台标签模块

#### GET /api/v1/tags
- **认证**：无
- **响应 data**：`[TagWithCount]`
  ```json
  [{
    "id": 1, "name": "Vue", "slug": "vue",
    "article_count": 3,
    "created_at": "2026-09-07T09:00:00.000Z"
  }]
  ```
- **排序**：id ASC

---

### 3.5 前台配置模块

#### GET /api/v1/config/about
- **认证**：无
- **响应**：
  ```json
  { "code": 200, "message": "success", "data": { "content": "Markdown内容" } }
  ```

#### GET /api/v1/config/site-info
- **认证**：无
- **响应**：
  ```json
  {
    "code": 200, "message": "success",
    "data": {
      "site_name": "My Blog",
      "author_name": "博主",
      "author_avatar": "",
      "author_bio": "",
      "announcement": ""
    }
  }
  ```
- **默认值**：缺失项使用默认值（site_name="My Blog", author_name="博主", 其余=""）

---

### 3.6 后台文章模块（需认证）

#### GET /api/v1/admin/articles
- **Query 参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| size | int | 10 | 每页条数 |
| status | string | — | "draft"/"published"，可选 |
| keyword | string | — | 标题模糊搜索 |
| include_deleted | bool | false | 是否含软删除 |

- **响应 data**：`PaginatedData<AdminArticleItem>`
  ```json
  {
    "items": [{
      "id": 1, "title": "标题", "status": "published", "is_deleted": false,
      "category": { "id": 1, "name": "技术", "slug": "tech" },
      "created_at": "...", "updated_at": "...", "published_at": "..."
    }],
    "total": 42, "page": 1, "size": 10
  }
  ```
- **排序**：created_at DESC

#### POST /api/v1/admin/articles
- **请求 Body**（ArticleCreate）：

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| title | string | 是 | 1-200字 | 标题 |
| content | string | 是 | ≥1字 | 正文 |
| summary | string | 否 | ≤500字 | 摘要（空则自动生成） |
| cover_image_url | string | 否 | ≤500字 | 封面图 |
| category_id | int | 否 | — | 分类ID |
| tag_ids | int[] | 否 | 默认[] | 标签ID数组 |
| status | string | 否 | 默认"draft" | "draft"/"published" |

- **响应 data**：`ArticleDetail`（完整文章对象）
- **特殊逻辑**：
  - summary 为空 → 调用 `generateSummary(content)` 自动生成
  - status="published" → 写入 `published_at`
  - created_at / updated_at 自动生成

#### PUT /api/v1/admin/articles/:id
- **请求 Body**（ArticleUpdate，全部 Optional）：同 ArticleCreate 但所有字段可选
- **使用 `exclude_unset` 语义**：仅更新传入的字段
- **特殊逻辑**：
  - tag_ids 传入 → 先删旧关联再建新（替换整个数组）
  - tag_ids 未传入 → 保持不变
  - status 从 draft → published 且 published_at 为 null → 写入 published_at
  - updated_at 自动更新
- **响应 data**：`ArticleDetail`
- **不存在**：code=40401

#### DELETE /api/v1/admin/articles/:id
- **逻辑**：软删除（is_deleted=true）
- **响应**：`{ "code": 200, "message": "success", "data": null }`
- **不存在**：code=40401

#### PATCH /api/v1/admin/articles/:id/status
- **请求 Body**：`{ "status": "draft" | "published" }`
- **逻辑**：切换状态。draft→published 且 published_at 为 null → 写入 published_at
- **响应 data**：`ArticleDetail`

---

### 3.7 后台分类模块（需认证）

#### GET /api/v1/admin/categories
- **响应 data**：`[CategoryOut]`（不含 article_count）
- **排序**：sort_order ASC, id ASC

#### POST /api/v1/admin/categories
- **请求 Body**：

| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| name | string | 是 | 1-100字，唯一 |
| slug | string | 是 | 1-100字，唯一 |
| sort_order | int | 否 | 默认0 |

- **冲突**：name 或 slug 重复 → code=40901
- **响应 data**：`CategoryOut`

#### PUT /api/v1/admin/categories/:id
- **请求 Body**：同上全部 Optional
- **冲突**：排除自身的唯一性校验 → code=40901
- **不存在**：code=40401
- **响应 data**：`CategoryOut`

#### DELETE /api/v1/admin/categories/:id
- **逻辑**：删除分类，关联文章的 category_id 置 null
- **不存在**：code=40401
- **响应**：data=null

---

### 3.8 后台标签模块（需认证）

#### GET /api/v1/admin/tags
- **响应 data**：`[TagOut]`（不含 article_count）
- **排序**：id ASC

#### POST /api/v1/admin/tags
- **请求 Body**：

| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| name | string | 是 | 1-100字，唯一 |
| slug | string | 是 | 1-100字，唯一 |

- **冲突**：code=40901
- **响应 data**：`TagOut`

#### PUT /api/v1/admin/tags/:id
- **请求 Body**：同上全部 Optional
- **冲突**：排除自身 → code=40901
- **不存在**：code=40401

#### DELETE /api/v1/admin/tags/:id
- **逻辑**：删除标签，从所有文章的 tag_ids 中移除该ID
- **不存在**：code=40401

---

### 3.9 后台配置模块（需认证）

#### GET /api/v1/admin/config/site-info
- **响应**：同前台 `GET /config/site-info`

#### PUT /api/v1/admin/config/site-info
- **请求 Body**：

| 字段 | 类型 | 默认值 |
|------|------|--------|
| site_name | string | "My Blog" |
| author_name | string | "博主" |
| author_avatar | string | "" |
| author_bio | string | "" |
| announcement | string | "" |

- **逻辑**：仅更新非 null 字段（`exclude_none` 语义）
- **响应 data**：完整 `SiteInfo`

#### PUT /api/v1/admin/config/about
- **请求 Body**：`{ "content": "string" }`
- **响应**：`{ "code": 200, "data": { "content": "..." } }`

---

### 3.10 仪表盘（需认证）

#### GET /api/v1/admin/dashboard
- **响应 data**：`DashboardData`
  ```json
  {
    "article_count": 42,
    "published_count": 30,
    "draft_count": 12,
    "category_count": 5,
    "tag_count": 8,
    "recent_articles": [<ArticleCard>]
  }
  ```
- **统计逻辑**：
  - article_count：未删除文章总数（含草稿）
  - published_count：published && !is_deleted
  - draft_count：draft && !is_deleted
  - recent_articles：最近5篇，按 created_at DESC

---

### 3.11 图片上传（需认证）

#### POST /api/v1/admin/images/upload
- **Content-Type**：`multipart/form-data`
- **表单字段**：`file`（单个文件）
- **限制**：
  - 格式：jpg/jpeg/png/gif/webp
  - 大小：≤5MB (5,242,880 bytes)
- **成功响应**：
  ```json
  { "code": 200, "data": { "url": "https://gitee.com/just-u/image-bed/raw/master/images/xxx.png" } }
  ```
- **错误**：
  - 文件过大 → code=40002
  - 格式不支持 → code=40003
  - 上传失败 → code=50002（不返回500）

---

### 3.12 健康检查

#### GET /api/v1/health
- **认证**：无
- **响应**：`{ "status": "ok" }`（非标准ApiResponse格式，直接返回对象）

---

## 4. 接口依赖关系

```
auth/login ← 无依赖（读取 admin/credentials.json）

articles (list) ← 读取 index/articles.json + categories/*.json + tags/*.json（关联填充）
articles (detail) ← 读取 articles/<id>.json + 索引（上下篇）+ categories + tags
articles (archive) ← 读取 index/articles.json

admin/articles (create) ← 写 articles/<id>.json + 更新 index/articles.json + 更新 index/counters.json
admin/articles (update) ← 写 articles/<id>.json + 更新 index/articles.json
admin/articles (delete) ← 写 articles/<id>.json + 更新 index/articles.json
admin/articles (status) ← 写 articles/<id>.json + 更新 index/articles.json

admin/categories (delete) ← 删 categories/<id>.json + 更新所有关联 articles/*.json + 更新索引
admin/tags (delete) ← 删 tags/<id>.json + 更新所有关联 articles/*.json + 更新索引

admin/dashboard ← 读取 index/articles.json + categories list + tags list
admin/images/upload ← 调用 Gitee API（不读写 Blob）
```

## 5. 管理员初始化

首次部署时需要初始化管理员凭证：
1. 检查 `admin/credentials.json` 是否存在
2. 不存在 → 从环境变量读取 `ADMIN_USERNAME` + `ADMIN_PASSWORD`
3. bcrypt 哈希密码
4. 写入 `admin/credentials.json`：`{username, password_hash}`
5. 存在 → 跳过（不覆盖）

触发时机：首次调用 `POST /api/v1/auth/login` 时检查并初始化（懒加载模式）。

## 6. Markdown 摘要生成规格

### 输入
Markdown 格式字符串（文章正文 content）

### 处理步骤
1. 去除代码块（```...```和~~~...~~~）
2. 去除行内代码（`...`）
3. 去除图片（`![alt](url)`）
4. 去除链接URL，保留链接文本（`[text](url)` → `text`）
5. 去除标题标记（#、##、###...）
6. 去除粗体（**text** → text）
7. 去除斜体（*text* → text）
8. 去除引用标记（>）
9. 去除列表标记（-、*、+、1.）
10. 去除水平线（---、***、___）
11. 去除多余空白
12. 取前200字
13. 追加 "..."

### 输出
纯文本字符串，≤203字（200 + "..."）

## 7. 前端构建规格

### 7.1 vite.config.js 修改
```javascript
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:8088'  // EdgeOne dev server
    }
  }
})
```

### 7.2 环境变量
- `.env`：`VITE_API_BASE_URL=/api/v1`（保持不变）
- 生产环境通过 EdgeOne CDN 部署，API 请求走相对路径 `/api/v1/*`

### 7.3 部署结构
```
EdgeOne Makers 项目
├── /                      → 前端 SPA (dist/index.html)
├── /assets/*              → 静态资源 (dist/assets/*)
├── /api/v1/*              → Cloud Function (cloud-functions/api/[[default]].js)
└── middleware.js          → SPA fallback (非 /api/* 且非文件 → /index.html)
```