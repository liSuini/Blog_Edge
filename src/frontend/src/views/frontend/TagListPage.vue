<template>
  <div class="tag-list-page">
    <div class="card page-header">
      <span class="page-label">标签</span>
      <h1 class="page-title">全部标签</h1>
      <p class="page-desc">共 {{ tags.length }} 个标签</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <EmptyState v-else-if="tags.length === 0" message="暂无标签" />

    <div v-else class="tag-cloud-grid">
      <router-link
        v-for="tag in tags"
        :key="tag.id"
        :to="`/tag/${tag.slug}`"
        class="card tag-card"
        :class="{ 'tag-hot': tag.article_count >= 5 }"
      >
        <span class="tag-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </span>
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-count">{{ tag.article_count }} 篇</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTags } from '@/api/tags'
import EmptyState from '@/components/common/EmptyState.vue'

const tags = ref([])
const loading = ref(false)

async function loadTags() {
  loading.value = true
  try {
    const res = await getTags()
    tags.value = res.data
  } catch (e) {
    tags.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadTags)
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

/* ---- 标签云网格 ---- */
.tag-cloud-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.tag-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  color: var(--color-body);
  text-decoration: none;
  transition: all var(--transition);
  border: 1px solid var(--color-border-light);
}

.tag-card:hover {
  color: var(--color-primary);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.tag-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-primary-alpha);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
}

.tag-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-heading);
}

.tag-count {
  font-size: 12px;
  color: var(--color-muted);
  background: var(--color-border-light);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
}

.tag-card:hover .tag-count {
  color: var(--color-primary);
  background: var(--color-primary-alpha);
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .page-title {
    font-size: 26px;
  }

  .tag-cloud-grid {
    gap: 10px;
  }
}
</style>