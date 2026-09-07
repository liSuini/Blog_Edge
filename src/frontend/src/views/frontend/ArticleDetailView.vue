<template>
  <div class="article-detail-view">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-msg">
      <p>{{ error }}</p>
      <router-link to="/" class="back-link">返回首页</router-link>
    </div>

    <template v-else-if="article">
      <div class="article-layout">
        <!-- 左侧目录栏 -->
        <aside class="article-toc">
          <TableOfContents :content="article.content" />
        </aside>

        <!-- 文章正文 -->
        <article class="article card">
        <!-- 文章头部 -->
        <header class="article-header">
          <h1 class="article-title">{{ article.title }}</h1>
          <div class="article-meta">
            <span v-if="article.category" class="meta-category">
              <router-link :to="`/category/${article.category.slug}`">{{ article.category.name }}</router-link>
            </span>
            <span v-if="article.tags && article.tags.length" class="meta-tags">
              <router-link
                v-for="tag in article.tags"
                :key="tag.id"
                :to="`/tag/${tag.slug}`"
                class="meta-tag"
              >#{{ tag.name }}</router-link>
            </span>
            <span class="meta-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {{ formatDate(article.published_at) }}
            </span>
          </div>
        </header>

        <!-- 文章内容 -->
        <MarkdownRenderer :content="article.content" />

        <!-- 上下篇导航 -->
        <nav class="prev-next">
          <router-link
            v-if="article.prev_article"
            :to="`/article/${article.prev_article.id}`"
            class="nav-card nav-prev"
          >
            <span class="nav-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              上一篇
            </span>
            <span class="nav-title">{{ article.prev_article.title }}</span>
          </router-link>
          <span v-else class="nav-card nav-placeholder"></span>

          <router-link
            v-if="article.next_article"
            :to="`/article/${article.next_article.id}`"
            class="nav-card nav-next"
          >
            <span class="nav-label">
              下一篇
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
            <span class="nav-title">{{ article.next_article.title }}</span>
          </router-link>
          <span v-else class="nav-card nav-placeholder"></span>
        </nav>
      </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleDetail } from '@/api/articles'
import MarkdownRenderer from '@/components/article/MarkdownRenderer.vue'
import TableOfContents from '@/components/article/TableOfContents.vue'

const route = useRoute()
const article = ref(null)
const loading = ref(false)
const error = ref(null)

async function loadArticle(id) {
  loading.value = true
  error.value = null
  article.value = null
  try {
    const res = await getArticleDetail(id)
    article.value = res.data
  } catch (e) {
    error.value = e.message || '文章加载失败'
  } finally {
    loading.value = false
    await nextTick()
    window.scrollTo(0, 0)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

watch(() => route.params.id, (newId) => {
  if (newId) loadArticle(newId)
}, { immediate: true })
</script>

<style scoped>
.article-detail-view {
  min-height: 400px;
}

/* ---- 文章布局：左侧目录 + 右侧正文 ---- */
.article-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

/* ---- 目录栏 ---- */
.article-toc {
  position: sticky;
  top: 40px;
}

/* ---- 响应式：窄屏隐藏目录 ---- */
@media (max-width: 1200px) {
  .article-layout {
    grid-template-columns: 1fr;
  }

  .article-toc {
    display: none;
  }
}

/* ---- 加载状态 ---- */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-muted);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---- 错误状态 ---- */
.error-msg {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-muted);
}

.back-link {
  display: inline-block;
  margin-top: 16px;
  color: var(--color-primary);
  font-weight: 500;
}

/* ---- 文章正文卡片 ---- */
.article {
  padding: 36px 40px;
}

/* ---- 文章头部 ---- */
.article-header {
  margin-bottom: 32px;
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 16px;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.meta-category a {
  color: var(--color-primary);
  font-weight: 500;
  padding: 3px 12px;
  background: var(--color-primary-alpha);
  border-radius: var(--radius-full);
  transition: background var(--transition-fast);
}

.meta-category a:hover {
  background: rgba(37, 99, 235, 0.15);
}

.meta-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  color: var(--color-secondary);
  transition: color var(--transition-fast);
}

.meta-tag:hover {
  color: var(--color-primary);
}

.meta-date {
  color: var(--color-muted);
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

/* ---- 上下篇导航 ---- */
.prev-next {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
}

.nav-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 48%;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: all var(--transition);
  text-decoration: none;
}

.nav-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.nav-placeholder {
  max-width: 48%;
  visibility: hidden;
}

.nav-next {
  text-align: right;
  margin-left: auto;
  align-items: flex-end;
}

.nav-label {
  font-size: 13px;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.nav-title {
  font-size: 15px;
  color: var(--color-heading);
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nav-card:hover .nav-title {
  color: var(--color-primary);
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .article {
    padding: 24px 20px;
  }

  .article-title {
    font-size: 24px;
  }

  .prev-next {
    flex-direction: column;
    gap: 12px;
  }

  .nav-card,
  .nav-placeholder {
    max-width: 100%;
  }

  .nav-next {
    text-align: left;
    margin-left: 0;
    align-items: flex-start;
  }

  .nav-placeholder {
    display: none;
  }

  .meta-date {
    margin-left: 0;
    width: 100%;
  }
}
</style>
