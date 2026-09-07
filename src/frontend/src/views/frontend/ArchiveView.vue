<template>
  <div class="archive-view">
    <div class="card page-header">
      <span class="page-label">归档</span>
      <h1 class="page-title">全部文章</h1>
      <p class="page-desc">共 {{ totalArticles }} 篇文章</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else>
      <EmptyState v-if="groups.length === 0" message="暂无文章" />
      <template v-else>
        <div v-for="group in groups" :id="`year-${group.year}`" :key="group.year" class="year-group">
          <div class="year-header">
            <span class="year-badge">{{ group.year }}</span>
          </div>
          <div v-for="monthItem in group.months" :key="monthItem.month" class="month-group">
            <h3 class="month-title">{{ monthItem.month }} 月</h3>
            <ul class="article-list">
              <li v-for="article in monthItem.articles" :key="article.id" class="article-item">
                <span class="article-date">{{ formatDay(article.published_at) }}</span>
                <span class="article-dot"></span>
                <router-link :to="`/article/${article.id}`" class="article-link">
                  {{ article.title }}
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getArchive } from '@/api/articles'
import EmptyState from '@/components/common/EmptyState.vue'

const groups = ref([])
const loading = ref(false)

const totalArticles = computed(() => {
  return groups.value.reduce((sum, g) => {
    return sum + g.months.reduce((s, m) => s + m.articles.length, 0)
  }, 0)
})

async function loadArchive() {
  loading.value = true
  try {
    const res = await getArchive()
    groups.value = res.data
  } catch (e) {
    groups.value = []
  } finally {
    loading.value = false
  }
}

function formatDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  await loadArchive()
  // 支持侧边栏归档锚点跳转 #/archives#year-2026
  const hash = window.location.hash
  const anchorMatch = hash.match(/year-(\d+)/)
  if (anchorMatch) {
    await nextTick()
    const el = document.getElementById(`year-${anchorMatch[1]}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<style scoped>
/* ---- 页头 ---- */
.page-header {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 48px;
  height: 3px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 14px;
  color: var(--color-muted);
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

/* ---- 年份分组 ---- */
.year-group {
  margin-bottom: 48px;
}

.year-header {
  margin-bottom: 24px;
}

.year-badge {
  display: inline-block;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  padding: 4px 16px;
  background: var(--color-primary-alpha);
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
}

/* ---- 月份分组 ---- */
.month-group {
  margin-bottom: 28px;
  padding-left: 8px;
}

.month-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-secondary);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--color-border);
}

/* ---- 文章列表 ---- */
.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  transition: padding var(--transition-fast);
}

.article-item:hover {
  padding-left: 6px;
}

.article-date {
  font-size: 13px;
  color: var(--color-muted);
  font-family: var(--font-mono);
  min-width: 48px;
  flex-shrink: 0;
}

.article-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.article-item:hover .article-dot {
  background: var(--color-primary);
}

.article-link {
  color: var(--color-body);
  font-size: 15px;
  text-decoration: none;
  transition: color var(--transition-fast);
  line-height: 1.5;
}

.article-link:hover {
  color: var(--color-primary);
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .page-title {
    font-size: 26px;
  }

  .year-badge {
    font-size: 18px;
  }

  .article-item {
    gap: 10px;
  }

  .article-date {
    font-size: 12px;
    min-width: 42px;
  }
}
</style>
