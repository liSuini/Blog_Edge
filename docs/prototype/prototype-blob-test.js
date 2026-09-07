// 原型1：Blob Storage CRUD 验证
// 在 EdgeOne Cloud Function 环境中运行
// 用法：部署后访问 GET /api/blob-test 触发

import { getStore } from "@edgeone/pages-blob";

export async function onRequest() {
  const results = {};
  
  try {
    // 1. 创建 Store（首次调用自动创建命名空间）
    const store = getStore({ name: "blog-test", consistency: "strong" });
    results.storeCreated = true;

    // 2. 写入文章
    const article = {
      id: 1,
      title: "测试文章",
      content: "这是测试内容",
      status: "published",
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    await store.setJSON("articles/1.json", article);
    results.articleWritten = true;

    // 3. 读取文章（验证 strong consistency：写后立即可读）
    const readBack = await store.get("articles/1.json", { type: "json" });
    results.articleRead = readBack !== null;
    results.articleTitleMatch = readBack?.title === "测试文章";

    // 4. 写入索引文件
    const index = [{
      id: 1,
      title: "测试文章",
      status: "published",
      is_deleted: false,
      published_at: null,
      category_id: null,
      tag_ids: [],
      created_at: article.created_at,
      updated_at: article.created_at,
    }];
    await store.setJSON("index/articles.json", index);
    results.indexWritten = true;

    // 5. 读取索引文件
    const readIndex = await store.get("index/articles.json", { type: "json" });
    results.indexRead = readIndex !== null;
    results.indexLength = readIndex?.length;
    results.indexIdMatch = readIndex?.[0]?.id === 1;

    // 6. 列出所有文章键
    const { blobs } = await store.list({ prefix: "articles/" });
    results.listCount = blobs.length;
    results.listKeys = blobs.map(b => b.key);

    // 7. 删除文章
    await store.delete("articles/1.json");
    const afterDelete = await store.get("articles/1.json", { type: "json" });
    results.deleteWorks = afterDelete === null;

    // 8. 清理测试数据
    await store.delete("index/articles.json");

    return Response.json({ status: "ok", results });
  } catch (err) {
    return Response.json({ status: "error", error: err.message, results });
  }
}
