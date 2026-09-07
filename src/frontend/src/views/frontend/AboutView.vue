<template>
  <div class="about-view">
    <div class="about-container">
    <div class="card page-header">
      <span class="page-label">关于</span>
      <h1 class="page-title">关于本站</h1>
    </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <template v-else>
        <div v-if="content" class="about-content">
          <MarkdownRenderer :content="content" />
        </div>
        <p v-else class="empty">暂无内容</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAboutContent } from '@/api/config'
import MarkdownRenderer from '@/components/article/MarkdownRenderer.vue'

const content = ref('')
const loading = ref(false)

async function loadAbout() {
  loading.value = true
  try {
    const res = await getAboutContent()
    content.value = res.data.content
  } catch (e) {
    console.error('加载关于页失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAbout)
</script>

<style scoped>
.about-view {
  min-height: 400px;
}

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

/* ---- 内容区 ---- */
.about-content {
  animation: fadeIn 0.4s ease forwards;
  padding: 4px 2px;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--color-muted);
  font-size: 15px;
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .page-title {
    font-size: 26px;
  }
}
</style>
