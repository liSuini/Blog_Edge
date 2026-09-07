<template>
  <aside class="blog-sidebar">
    <!-- 作者卡片 -->
    <div class="card author-card">
      <div class="author-avatar-wrap">
        <img
          v-if="siteInfo.author_avatar"
          :src="siteInfo.author_avatar"
          alt="avatar"
          class="author-avatar"
        />
        <div v-else class="author-avatar author-avatar-placeholder">
          {{ siteInitial }}
        </div>
      </div>
      <h3 class="author-name">{{ siteInfo.author_name }}</h3>
      <p class="author-bio">{{ siteInfo.author_bio }}</p>

      <!-- 统计数字 -->
      <div class="author-stats">
        <router-link to="/archives" class="stat-item">
          <span class="stat-num">{{ totalArticles }}</span>
          <span class="stat-label">文章</span>
        </router-link>
        <router-link to="/tags" class="stat-item">
          <span class="stat-num">{{ tags.length }}</span>
          <span class="stat-label">标签</span>
        </router-link>
        <router-link to="/categories" class="stat-item">
          <span class="stat-num">{{ categories.length }}</span>
          <span class="stat-label">分类</span>
        </router-link>
      </div>
    </div>

    <!-- 公告 -->
    <div v-if="siteInfo.announcement" class="card notice-card">
      <h4 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        公告
      </h4>
      <p class="notice-text">{{ siteInfo.announcement }}</p>
    </div>

    <!-- 最新文章 -->
    <div v-if="recentArticles.length" class="card recent-card">
      <h4 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        最新文章
      </h4>
      <ul class="sidebar-list">
        <li v-for="article in recentArticles" :key="article.id">
          <router-link :to="`/article/${article.id}`" class="recent-item">
            <span class="recent-title">{{ article.title }}</span>
            <span class="recent-date">{{ formatDate(article.published_at) }}</span>
          </router-link>
        </li>
      </ul>
    </div>

    <!-- 分类 -->
    <div v-if="categories.length" class="card category-card">
      <h4 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
        分类
        <router-link to="/categories" class="more-link">更多</router-link>
      </h4>
      <ul class="sidebar-list">
        <li v-for="category in categories.slice(0, 6)" :key="category.id">
          <router-link :to="`/category/${category.slug}`" class="cat-item">
            <span class="cat-name">{{ category.name }}</span>
            <span class="cat-count">{{ category.article_count }}</span>
          </router-link>
        </li>
      </ul>
    </div>

    <!-- 标签云 -->
    <div v-if="tags.length" class="card tag-card">
      <h4 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        标签
      </h4>
      <div class="tag-cloud">
        <router-link
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tag/${tag.slug}`"
          class="tag-chip"
        >{{ tag.name }}</router-link>
      </div>
    </div>

    <!-- 归档 -->
    <div v-if="archiveGroups.length" class="card archive-card">
      <h4 class="card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        归档
      </h4>
      <ul class="sidebar-list">
        <li v-for="group in archiveGroups" :key="group.year">
          <router-link :to="`/archives#year-${group.year}`" class="archive-item">
            <span class="archive-label">
              {{ group.year }}
              <template v-if="group.months.length">
                / {{ formatMonth(group.months) }}
              </template>
            </span>
            <span class="archive-count">{{ countArticles(group) }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getArticles } from '@/api/articles'
import { getCategories } from '@/api/categories'
import { getTags } from '@/api/tags'
import { getArchive } from '@/api/articles'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()

const recentArticles = ref([])
const categories = ref([])
const tags = ref([])
const archiveGroups = ref([])

const siteInfo = computed(() => siteStore.siteInfo)

const totalArticles = computed(() => {
  return archiveGroups.value.reduce((sum, g) => {
    return sum + g.months.reduce((s, m) => s + m.articles.length, 0)
  }, 0)
})

const siteInitial = computed(() => {
  const name = siteInfo.value.author_name || '博主'
  return name.charAt(0).toUpperCase()
})

async function loadSidebar() {
  try {
    const [articlesRes, categoriesRes, tagsRes, archiveRes] = await Promise.all([
      getArticles({ page: 1, size: 5 }),
      getCategories(),
      getTags(),
      getArchive(),
    ])
    recentArticles.value = articlesRes.data.items || []
    categories.value = categoriesRes.data || []
    tags.value = tagsRes.data || []
    archiveGroups.value = archiveRes.data || []
  } catch (e) {
    console.error('侧边栏数据加载失败:', e)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatMonth(months) {
  return months.map((m) => `${m.month}月`).join(' / ')
}

function countArticles(group) {
  return group.months.reduce((s, m) => s + m.articles.length, 0)
}

onMounted(async () => {
  await siteStore.loadSiteInfo()
  loadSidebar()
})
</script>

<style scoped>
.blog-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---- 作者卡片 ---- */
.author-card {
  text-align: center;
  padding: 16px 12px;
}

.author-avatar-wrap {
  margin-bottom: 8px;
}

.author-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-surface);
  background: var(--color-primary-alpha);
}

.author-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary-alpha), var(--color-border-light));
}

.author-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 2px;
}

.author-bio {
  font-size: 11px;
  color: var(--color-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

/* ---- 统计数字 ---- */
.author-stats {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-secondary);
  transition: color var(--transition-fast);
}

.stat-item:hover {
  color: var(--color-primary);
}

.stat-num {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-heading);
}

.stat-label {
  font-size: 10px;
}

/* ---- 卡片标题 ---- */
.card-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.card-title svg {
  color: var(--color-primary);
  width: 12px;
  height: 12px;
}

.more-link {
  margin-left: auto;
  font-size: 10px;
  font-weight: 400;
  color: var(--color-muted);
}

.more-link:hover {
  color: var(--color-primary);
}

/* ---- 侧边栏列表 ---- */
.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-list li {
  margin-bottom: 2px;
}

/* ---- 最新文章 ---- */
.recent-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 0;
  color: var(--color-body);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.recent-item:hover {
  color: var(--color-primary);
  padding-left: 6px;
}

.recent-title {
  font-size: 11px;
  line-height: 1.4;
}

.recent-date {
  font-size: 10px;
  color: var(--color-muted);
  font-family: var(--font-mono);
}

/* ---- 分类 ---- */
.category-item,
.archive-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
  color: var(--color-body);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.category-item:hover,
.archive-item:hover {
  color: var(--color-primary);
  padding-left: 10px;
}

.cat-name {
  font-size: 11px;
}

.cat-count {
  font-size: 10px;
  color: var(--color-muted);
  background: var(--color-border-light);
  padding: 1px 5px;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
}

/* ---- 标签云 ---- */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-chip {
  font-size: 10px;
  color: var(--color-secondary);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.tag-chip:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-alpha);
}

/* ---- 归档 ---- */
.archive-label {
  font-size: 11px;
}

.archive-count {
  font-size: 10px;
  color: var(--color-muted);
  font-family: var(--font-mono);
}

/* ---- 公告 ---- */
.notice-text {
  font-size: 11px;
  color: var(--color-secondary);
  line-height: 1.5;
}
</style>