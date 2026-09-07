<template>
  <div class="category-list-page">
    <div class="card page-header">
      <span class="page-label">分类</span>
      <h1 class="page-title">全部分类</h1>
      <p class="page-desc">共 {{ categories.length }} 个分类</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <EmptyState v-else-if="categories.length === 0" message="暂无分类" />

    <div v-else class="category-grid">
      <router-link
        v-for="category in categories"
        :key="category.id"
        :to="`/category/${category.slug}`"
        class="card category-card"
      >
        <span class="category-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </span>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-count">{{ category.article_count }} 篇文章</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories } from '@/api/categories'
import EmptyState from '@/components/common/EmptyState.vue'

const categories = ref([])
const loading = ref(false)

async function loadCategories() {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    categories.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
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

/* ---- 分类网格 ---- */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  color: var(--color-body);
  text-decoration: none;
  transition: all var(--transition);
}

.category-card:hover {
  color: var(--color-body);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.category-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-alpha);
  color: var(--color-primary);
  border-radius: var(--radius-md);
}

.category-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-heading);
}

.category-count {
  font-size: 13px;
  color: var(--color-muted);
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .page-title {
    font-size: 26px;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>