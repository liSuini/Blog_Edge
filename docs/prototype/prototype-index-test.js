// 原型3：索引文件 read-modify-write 验证
// 部署后访问 GET /api/index-test 触发，模拟连续创建3篇文章

import { getStore } from "@edgeone/pages-blob";

export async function onRequest() {
  const store = getStore({ name: "blog-test", consistency: "strong" });
  const results = { steps: [] };

  try {
    // 初始化计数器
    let counters = await store.get("index/counters.json", { type: "json" });
    if (!counters) {
      counters = { article: 0, category: 0, tag: 0 };
      await store.setJSON("index/counters.json", counters);
    }
    results.steps.push({ step: "init_counters", counters });

    // 模拟创建3篇文章
    for (let i = 0; i < 3; i++) {
      // 1. 读取当前索引（初始为 null → 空数组）
      let index = await store.get("index/articles.json", { type: "json" });
      if (!index) index = [];

      // 2. 自增 ID
      counters = await store.get("index/counters.json", { type: "json" });
      counters.article += 1;
      const newId = counters.article;
      const now = new Date().toISOString();

      // 3. 创建文章
      const article = {
        id: newId,
        title: `测试文章${newId}`,
        content: `内容${newId}`,
        status: "published",
        is_deleted: false,
        category_id: null,
        tag_ids: [],
        created_at: now,
        updated_at: now,
        published_at: now,
      };
      await store.setJSON(`articles/${newId}.json`, article);

      // 4. 更新索引
      index.push({
        id: newId,
        title: article.title,
        status: "published",
        is_deleted: false,
        published_at: now,
        category_id: null,
        tag_ids: [],
        created_at: now,
        updated_at: now,
      });
      await store.setJSON("index/articles.json", index);

      // 5. 更新计数器
      await store.setJSON("index/counters.json", counters);

      results.steps.push({
        step: `create_article_${newId}`,
        indexLength: index.length,
        articleId: newId,
      });
    }

    // 验证：读取最终索引
    const finalIndex = await store.get("index/articles.json", { type: "json" });
    results.finalIndexLength = finalIndex?.length;
    results.finalIndexIds = finalIndex?.map(item => item.id);

    // 验证：读取每篇文章详情
    const articles = [];
    for (const item of finalIndex) {
      const art = await store.get(`articles/${item.id}.json`, { type: "json" });
      articles.push({ id: art.id, title: art.title });
    }
    results.articles = articles;

    // 验证：模拟列表分页（page=1, size=2）
    const sorted = [...finalIndex].sort((a, b) =>
      new Date(b.published_at) - new Date(a.published_at)
    );
    const page1 = sorted.slice(0, 2);
    results.pagination = { total: sorted.length, page1Ids: page1.map(i => i.id) };

    // 清理测试数据
    for (const item of finalIndex) {
      await store.delete(`articles/${item.id}.json`);
    }
    await store.delete("index/articles.json");
    await store.delete("index/counters.json");
    results.cleanup = "done";

    return Response.json({ status: "ok", results });
  } catch (err) {
    return Response.json({ status: "error", error: err.message, results });
  }
}
