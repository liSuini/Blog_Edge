<template>
  <div class="tag-view">
    <div class="card page-header">
      <span class="page-label">标签</span>
      <h1 class="page-title">{{ tagSlug }}</h1>
      <p v-if="total > 0" class="page-desc">共 {{ total }} 篇文章</p>
    </div>

    <div v-if="loading && articles.length === 0" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else>
      <EmptyState v-if="articles.length === 0" message="该标签下暂无文章" />
      <template v-else>
        <div class="article-list">
          <ArticleCard
            v-for="(article, index) in articles"
            :key="article.id"
            :article="article"
            :index="index"
          />
        </div>
        <Pagination
          :page="page"
          :total-pages="totalPages"
          @change="handlePageChange"
        />
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticles } from '@/api/articles'
import ArticleCard from '@/components/article/ArticleCard.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const articles = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const totalPages = ref(1)

const tagSlug = ref('')

async function loadArticles() {
  loading.value = true
  tagSlug.value = route.params.slug || ''
  try {
    const res = await getArticles({
      page: page.value,
      size: 10,
      tag_slug: route.params.slug,
    })
    articles.value = res.data.items
    total.value = res.data.total
    totalPages.value = Math.ceil(res.data.total / res.data.size)
  } catch (e) {
    articles.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage) {
  page.value = newPage
  router.push({ query: { ...route.query, page: newPage } })
  loadArticles()
}

watch(() => route.params.slug, () => {
  page.value = 1
  loadArticles()
})

onMounted(() => {
  const qPage = parseInt(route.query.page) || 1
  page.value = qPage
  loadArticles()
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

.page-label {
  display: inline-block;
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.02em;
  margin-bottom: 6px;
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

/* ---- 文章列表 ---- */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .page-title {
    font-size: 26px;
  }
}
</style>
