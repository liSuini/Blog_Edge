<template>
  <div class="article-list-view">
    <div class="page-header">
      <h1>文章管理</h1>
      <router-link to="/admin/articles/new" class="btn-primary">新建文章</router-link>
    </div>

    <div class="toolbar">
      <select v-model="filters.status" @change="handleFilter" class="filter-select">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="published">已发布</option>
      </select>
      <input
        v-model="filters.keyword"
        @keyup.enter="handleFilter"
        placeholder="搜索文章标题..."
        class="search-input"
      />
      <button @click="handleFilter" class="btn-secondary">搜索</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <div v-if="articles.length === 0" class="empty">暂无文章</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>状态</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in articles" :key="article.id">
            <td>{{ article.id }}</td>
            <td>{{ article.title }}</td>
            <td>
              <span :class="['status-tag', article.status]">{{ article.status === 'published' ? '已发布' : '草稿' }}</span>
            </td>
            <td>{{ formatDate(article.published_at) }}</td>
            <td class="actions">
              <button @click="toggleStatus(article)" class="btn-text">
                {{ article.status === 'published' ? '撤回' : '发布' }}
              </button>
              <router-link :to="`/admin/articles/${article.id}/edit`" class="btn-text">编辑</router-link>
              <button @click="confirmDelete(article)" class="btn-text danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        :page="page"
        :total-pages="totalPages"
        @change="handlePageChange"
      />
    </template>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3>确认删除</h3>
        <p>确定要删除文章「{{ deleteTarget?.title }}」吗？删除后可从回收站恢复。</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-secondary">取消</button>
          <button @click="handleDelete" class="btn-danger" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminArticles, deleteArticle, updateArticleStatus } from '@/api/articles'
import Pagination from '@/components/common/Pagination.vue'

const articles = ref([])
const page = ref(1)
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)

const filters = reactive({ status: '', keyword: '' })

const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

async function loadArticles() {
  loading.value = true
  try {
    const res = await getAdminArticles({
      page: page.value,
      size: 10,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
    })
    articles.value = res.data.items
    total.value = res.data.total
    totalPages.value = Math.ceil(res.data.total / res.data.size)
  } catch (e) {
    console.error('加载文章失败:', e)
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  page.value = 1
  loadArticles()
}

function handlePageChange(newPage) {
  page.value = newPage
  loadArticles()
}

async function toggleStatus(article) {
  const newStatus = article.status === 'published' ? 'draft' : 'published'
  try {
    await updateArticleStatus(article.id, newStatus)
    article.status = newStatus
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

function confirmDelete(article) {
  deleteTarget.value = article
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await deleteArticle(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
    await loadArticles()
  } catch (e) {
    alert(e.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(loadArticles)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  max-width: 320px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
  text-decoration: none;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f9fafb;
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

.status-tag {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.published {
  background: #d1fae5;
  color: #065f46;
}

.status-tag.draft {
  background: #fef3c7;
  color: #92400e;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-text {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-text.danger {
  color: #dc2626;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 28px;
  width: 400px;
}

.modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.modal p {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
}
</style>
