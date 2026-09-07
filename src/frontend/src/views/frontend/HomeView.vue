<template>
  <div class="home-view">
    <div v-if="loading && articles.length === 0" class="loading">
      <p>加载中...</p>
    </div>

    <template v-else>
      <EmptyState v-if="articles.length === 0" message="还没有发布任何文章" />
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
import { ref, onMounted, watch } from 'vue'
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
const size = ref(10)
const loading = ref(false)

const totalPages = ref(1)

async function loadArticles() {
  loading.value = true
  try {
    const res = await getArticles({
      page: page.value,
      size: size.value,
      category_slug: route.query.category_slug,
      tag_slug: route.query.tag_slug,
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

watch(() => route.query, (newQuery) => {
  const qPage = parseInt(newQuery.page) || 1
  page.value = qPage
  loadArticles()
})

onMounted(() => {
  const qPage = parseInt(route.query.page) || 1
  page.value = qPage
  loadArticles()
})
</script>

<style scoped>
.home-view {
  min-height: 400px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #9ca3af;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
