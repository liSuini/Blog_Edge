<template>
  <div class="category-list-view">
    <div class="page-header">
      <h1>分类管理</h1>
      <button @click="openCreate" class="btn-primary">新建分类</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <div v-if="categories.length === 0" class="empty">暂无分类，点击右上角创建</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>Slug</th>
            <th>排序</th>
            <th>文章数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td>{{ cat.id }}</td>
            <td>{{ cat.name }}</td>
            <td class="slug-cell">{{ cat.slug }}</td>
            <td>{{ cat.sort_order }}</td>
            <td>
              <span class="count-badge">{{ cat.article_count }}</span>
            </td>
            <td class="actions">
              <button @click="openEdit(cat)" class="btn-text">编辑</button>
              <button @click="confirmDelete(cat)" class="btn-text danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editing ? '编辑分类' : '新建分类' }}</h3>
        <div class="form-group">
          <label>名称 <span class="required">*</span></label>
          <input
            v-model="formData.name"
            @input="autoSlug"
            placeholder="分类名称"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Slug <span class="required">*</span></label>
          <input
            v-model="formData.slug"
            @blur="formData.slug = formData.slug.trim()"
            placeholder="url-friendly-slug"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>排序值</label>
          <input
            v-model.number="formData.sort_order"
            type="number"
            placeholder="0"
            class="form-input"
          />
          <p class="form-hint">数字越小越靠前</p>
        </div>
        <div v-if="formError" class="form-error">{{ formError }}</div>
        <div class="modal-actions">
          <button @click="closeForm" class="btn-secondary">取消</button>
          <button @click="handleSubmit" class="btn-primary" :disabled="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3>确认删除</h3>
        <p>
          确定要删除分类「{{ deleteTarget?.name }}」吗？
        </p>
        <p v-if="deleteTarget && deleteTarget.article_count > 0" class="warning-text">
          该分类下有 {{ deleteTarget.article_count }} 篇已发布文章，删除后文章将变为未分类。
        </p>
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
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'

const categories = ref([])
const loading = ref(false)

// 表单状态
const showFormModal = ref(false)
const editing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formError = ref('')
const formData = reactive({
  name: '',
  slug: '',
  sort_order: 0,
})

// 删除状态
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

async function loadCategories() {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (e) {
    console.error('加载分类失败:', e)
  } finally {
    loading.value = false
  }
}

function autoSlug() {
  if (!editing.value) {
    formData.slug = formData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
  }
}

function openCreate() {
  editing.value = false
  editingId.value = null
  formData.name = ''
  formData.slug = ''
  formData.sort_order = 0
  formError.value = ''
  showFormModal.value = true
}

function openEdit(cat) {
  editing.value = true
  editingId.value = cat.id
  formData.name = cat.name
  formData.slug = cat.slug
  formData.sort_order = cat.sort_order
  formError.value = ''
  showFormModal.value = true
}

function closeForm() {
  showFormModal.value = false
  formError.value = ''
}

async function handleSubmit() {
  if (!formData.name.trim()) {
    formError.value = '请输入分类名称'
    return
  }
  if (!formData.slug.trim()) {
    formError.value = '请输入 Slug'
    return
  }

  submitting.value = true
  formError.value = ''
  try {
    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      sort_order: formData.sort_order || 0,
    }
    if (editing.value) {
      await updateCategory(editingId.value, payload)
    } else {
      await createCategory(payload)
    }
    showFormModal.value = false
    await loadCategories()
  } catch (e) {
    formError.value = e.message || '保存失败'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(cat) {
  deleteTarget.value = cat
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await deleteCategory(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
    await loadCategories()
  } catch (e) {
    alert(e.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(loadCategories)
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

.slug-cell {
  color: #6b7280;
  font-family: monospace;
  font-size: 13px;
}

.count-badge {
  display: inline-block;
  min-width: 28px;
  padding: 2px 8px;
  border-radius: 12px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.6;
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

.btn-text {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
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
  font-size: 14px;
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
  width: 420px;
  max-width: 90vw;
}

.modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.modal p {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.warning-text {
  color: #dc2626 !important;
  font-size: 13px !important;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #dc2626;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.form-error {
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
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
