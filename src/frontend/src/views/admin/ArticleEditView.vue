<template>
  <div class="article-edit-view">
    <div class="page-header">
      <h1>{{ isNew ? '新建文章' : '编辑文章' }}</h1>
      <router-link to="/admin/articles" class="btn-back">返回列表</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <form v-else @submit.prevent="handleSave" class="article-form">
      <div class="form-group">
        <label>标题</label>
        <input v-model="form.title" type="text" placeholder="请输入文章标题" class="input" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>分类</label>
          <select v-model="form.category_id" class="input">
            <option :value="null">无分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group tags-group">
          <label>标签</label>
          <div class="tags-select">
            <label v-for="tag in tags" :key="tag.id" class="tag-checkbox">
              <input type="checkbox" :value="tag.id" v-model="form.tag_ids" />
              {{ tag.name }}
            </label>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>摘要（留空自动截取）</label>
        <textarea v-model="form.summary" placeholder="不填则自动截取正文前200字" rows="3" class="input"></textarea>
      </div>

      <div class="form-group">
        <label>封面图</label>
        <div class="cover-upload">
          <div class="cover-preview" v-if="form.cover_image_url">
            <img :src="form.cover_image_url" alt="封面预览" />
            <button type="button" @click="form.cover_image_url = ''" class="cover-remove">×</button>
          </div>
          <label v-else class="cover-upload-area" :class="{ uploading: coverUploading }">
            <input type="file" accept="image/*" @change="handleCoverUpload" hidden :disabled="coverUploading" />
            <svg v-if="!coverUploading" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span v-if="coverUploading" class="uploading-text">上传中...</span>
            <span v-else class="upload-text">点击上传封面图</span>
          </label>
          <div class="cover-url-input">
            <input v-model="form.cover_image_url" type="text" placeholder="或直接粘贴图片URL" class="input" />
          </div>
        </div>
        <p v-if="coverError" class="error-msg cover-error">{{ coverError }}</p>
      </div>

      <div class="form-group">
        <label>正文（Markdown）</label>
        <MarkdownEditor v-model="form.content" />
      </div>

      <div class="form-actions">
        <p v-if="error" class="error-msg">{{ error }}</p>
        <div class="btn-group">
          <button type="button" @click="handleSave('draft')" class="btn-secondary" :disabled="saving">
            保存为草稿
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存并发布' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticleDetail, createArticle, updateArticle } from '@/api/articles'
import { getAdminCategories } from '@/api/categories'
import { getAdminTags } from '@/api/tags'
import { uploadImage } from '@/api/images'
import MarkdownEditor from '@/components/admin/MarkdownEditor.vue'

const route = useRoute()
const router = useRouter()

const isNew = computed(() => route.name === 'admin-article-new')
const articleId = computed(() => route.params.id)

const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const coverUploading = ref(false)
const coverError = ref(null)

const categories = ref([])
const tags = ref([])

const form = reactive({
  title: '',
  content: '',
  summary: '',
  cover_image_url: '',
  category_id: null,
  tag_ids: [],
  status: 'draft',
})

async function loadOptions() {
  try {
    const [catRes, tagRes] = await Promise.all([getAdminCategories(), getAdminTags()])
    categories.value = catRes.data
    tags.value = tagRes.data
  } catch (e) {
    console.error('加载分类标签失败:', e)
  }
}

async function loadArticle() {
  if (isNew.value) return
  loading.value = true
  try {
    const res = await getArticleDetail(articleId.value)
    const a = res.data
    form.title = a.title || ''
    form.content = a.content || ''
    form.summary = a.summary || ''
    form.cover_image_url = a.cover_image_url || ''
    form.category_id = a.category?.id || null
    form.tag_ids = a.tags?.map(t => t.id) || []
    form.status = a.status || 'draft'
  } catch (e) {
    error.value = e.message || '加载文章失败'
  } finally {
    loading.value = false
  }
}

async function handleSave(forceStatus) {
  if (!form.title.trim()) {
    error.value = '请输入标题'
    return
  }
  if (!form.content.trim()) {
    error.value = '请输入正文内容'
    return
  }

  saving.value = true
  error.value = null

  const payload = {
    title: form.title,
    content: form.content,
    summary: form.summary || null,
    cover_image_url: form.cover_image_url || null,
    category_id: form.category_id,
    tag_ids: form.tag_ids,
    status: forceStatus === 'draft' ? 'draft' : 'published',
  }

  try {
    if (isNew.value) {
      await createArticle(payload)
    } else {
      await updateArticle(articleId.value, payload)
    }
    router.push('/admin/articles')
  } catch (e) {
    error.value = e.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  coverUploading.value = true
  coverError.value = null
  try {
    const res = await uploadImage(file)
    if (res.data && res.data.url) {
      form.cover_image_url = res.data.url
    } else {
      coverError.value = res.message || '上传失败'
    }
  } catch (e) {
    coverError.value = e.message || '上传失败'
  } finally {
    coverUploading.value = false
    e.target.value = ''
  }
}

onMounted(async () => {
  await loadOptions()
  await loadArticle()
})
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

.btn-back {
  color: #2563eb;
  font-size: 14px;
  text-decoration: none;
}

.article-form {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.tags-group .tags-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.tag-checkbox input {
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.error-msg {
  color: #dc2626;
  font-size: 14px;
}

.btn-group {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #9ca3af;
}

/* ---- 封面上传 ---- */
.cover-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.cover-preview {
  position: relative;
  width: 240px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.cover-remove:hover {
  background: rgba(220, 38, 38, 0.8);
}

.cover-upload-area {
  width: 240px;
  height: 140px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #9ca3af;
  transition: border-color 0.2s, color 0.2s;
}

.cover-upload-area:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.cover-upload-area.uploading {
  border-color: #2563eb;
  color: #2563eb;
}

.upload-text {
  font-size: 13px;
}

.uploading-text {
  font-size: 13px;
}

.cover-url-input {
  flex: 1;
  min-width: 200px;
}

.cover-error {
  margin-top: 6px;
  font-size: 13px;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
