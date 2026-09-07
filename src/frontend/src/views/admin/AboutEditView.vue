<template>
  <div class="about-edit-view">
    <div class="page-header">
      <h1>编辑关于页</h1>
      <button @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <div class="editor-wrapper">
        <MarkdownEditor v-model="content" />
      </div>
      <div v-if="saveError" class="save-error">{{ saveError }}</div>
      <div v-if="saved" class="save-success">保存成功</div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAboutContent, updateAboutContent } from '@/api/config'
import MarkdownEditor from '@/components/admin/MarkdownEditor.vue'

const content = ref('')
const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

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

async function handleSave() {
  saving.value = true
  saveError.value = ''
  saved.value = false
  try {
    await updateAboutContent(content.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e) {
    saveError.value = e.message || '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(loadAbout)
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

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 8px 20px;
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

.loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.editor-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.save-error {
  margin-top: 12px;
  padding: 10px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
}

.save-success {
  margin-top: 12px;
  padding: 10px 16px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  font-size: 14px;
}
</style>
