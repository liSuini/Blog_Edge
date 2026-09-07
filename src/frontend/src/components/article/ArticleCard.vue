<template>
  <article class="article-card" :class="{ 'cover-right': isCoverRight }">
    <router-link :to="`/article/${article.id}`" class="card-link">
      <!-- 封面 -->
      <div class="card-cover">
        <img
          v-if="article.cover_image_url"
          :src="article.cover_image_url"
          :alt="article.title"
          loading="lazy"
        />
        <div v-else class="cover-placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      </div>

      <!-- 内容 -->
      <div class="card-body">
        <h2 class="card-title">{{ article.title }}</h2>
        <p class="card-summary">{{ article.summary || '暂无摘要' }}</p>
        <div class="card-meta">
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
          <span class="meta-date">{{ formatDate(article.published_at) }}</span>
        </div>
      </div>
    </router-link>
  </article>
</template>

<script setup>
const props = defineProps({
  article: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const isCoverRight = props.index % 2 === 1

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.article-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition), transform var(--transition);
}

.article-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.card-link {
  display: flex;
  text-decoration: none;
  color: inherit;
}

/* ---- 封面 ---- */
.card-cover {
  width: 280px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  background: var(--color-border-light);
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.article-card:hover .card-cover img {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  background: linear-gradient(135deg, var(--color-primary-alpha), var(--color-border-light));
}

/* 封面在右侧时通过 flex order 反转 */
.cover-right .card-link {
  flex-direction: row-reverse;
}

/* ---- 内容区 ---- */
.card-body {
  flex: 1;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 19px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 8px;
  line-height: 1.4;
  transition: color var(--transition-fast);
}

.article-card:hover .card-title {
  color: var(--color-primary);
}

.card-summary {
  font-size: 14px;
  color: var(--color-secondary);
  line-height: 1.7;
  margin-bottom: 14px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---- Meta ---- */
.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
}

.meta-category a {
  color: var(--color-primary);
  font-weight: 500;
  padding: 2px 10px;
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
  font-size: 12px;
  font-family: var(--font-mono);
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .card-link,
  .cover-right .card-link {
    flex-direction: column;
  }

  .card-cover {
    width: 100%;
    height: 180px;
  }

  .card-body {
    padding: 18px 20px;
  }

  .card-title {
    font-size: 17px;
  }
}
</style>