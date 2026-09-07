<template>
  <div class="dashboard-view">
    <h1>仪表盘</h1>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else-if="data">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon articles">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ data.article_count }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon published">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ data.published_count }}</div>
            <div class="stat-label">已发布</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon drafts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ data.draft_count }}</div>
            <div class="stat-label">草稿</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon categories">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14-4H5m14 8H5m14 4H5" /></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ data.category_count }}</div>
            <div class="stat-label">分类</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon tags">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ data.tag_count }}</div>
            <div class="stat-label">标签</div>
          </div>
        </div>
      </div>

      <div class="recent-section">
        <h2>最近文章</h2>
        <div v-if="data.recent_articles.length === 0" class="empty">暂无已发布文章</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>分类</th>
              <th>标签</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in data.recent_articles" :key="article.id">
              <td>{{ article.id }}</td>
              <td>{{ article.title }}</td>
              <td>{{ article.category?.name || '—' }}</td>
              <td>
                <span v-for="tag in article.tags" :key="tag.id" class="tag-badge">{{ tag.name }}</span>
                <span v-if="!article.tags.length">—</span>
              </td>
              <td>{{ formatDate(article.published_at) }}</td>
              <td>
                <router-link :to="`/admin/articles/${article.id}/edit`" class="btn-text">编辑</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboard } from '@/api/dashboard'

const data = ref(null)
const loading = ref(false)

async function loadDashboard() {
  loading.value = true
  try {
    const res = await getDashboard()
    data.value = res.data
  } catch (e) {
    console.error('加载仪表盘失败:', e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(loadDashboard)
</script>

<style scoped>
.dashboard-view h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #9ca3af;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.articles {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.published {
  background: #ecfdf5;
  color: #10b981;
}

.stat-icon.drafts {
  background: #fffbeb;
  color: #f59e0b;
}

.stat-icon.categories {
  background: #f5f3ff;
  color: #7c3aed;
}

.stat-icon.tags {
  background: #fef2f2;
  color: #ef4444;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 4px;
}

.recent-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.tag-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  margin-right: 4px;
}

.empty {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
  background: #fff;
  border-radius: 8px;
}

.btn-text {
  color: #2563eb;
  font-size: 14px;
  text-decoration: none;
}

.btn-text:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
