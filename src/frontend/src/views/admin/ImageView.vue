<template>
  <div class="image-view">
    <div class="page-header">
      <h1>图片上传</h1>
    </div>

    <div class="upload-card">
      <div
        class="upload-zone"
        :class="{ dragging: isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="$refs.fileInput.click()"
      >
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="upload-text">点击或拖拽图片到此处上传</p>
        <p class="upload-hint">支持 JPG / PNG / GIF / WebP，最大 5MB</p>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <div v-if="uploading" class="upload-status">
        <span class="spinner"></span> 上传中...
      </div>

      <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
    </div>

    <!-- 上传结果 -->
    <div v-if="uploadedUrl" class="result-card">
      <h3>上传成功</h3>
      <div class="preview-wrapper">
        <img :src="uploadedUrl" alt="uploaded" class="preview-img" />
      </div>
      <div class="url-row">
        <label>CDN URL：</label>
        <input :value="uploadedUrl" readonly class="url-input" ref="urlInput" />
        <button @click="copyUrl" class="btn-secondary">{{ copied ? '已复制' : '复制' }}</button>
      </div>
      <p class="result-hint">将此 URL 粘贴到文章封面图或 Markdown 中使用</p>
    </div>

    <!-- 上传历史 -->
    <div v-if="uploadHistory.length > 0" class="history-card">
      <h3>本次上传历史</h3>
      <div class="history-grid">
        <div v-for="(item, idx) in uploadHistory" :key="idx" class="history-item">
          <img :src="item.url" :alt="item.name" class="history-thumb" />
          <span class="history-name">{{ item.name }}</span>
          <button @click="copyText(item.url)" class="btn-text">复制URL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadImage } from '@/api/images'

const fileInput = ref(null)
const urlInput = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const uploadedUrl = ref('')
const copied = ref(false)
const uploadHistory = ref([])

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    await doUpload(file)
    e.target.value = ''
  }
}

async function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) {
    await doUpload(file)
  }
}

async function doUpload(file) {
  uploading.value = true
  uploadError.value = ''
  uploadedUrl.value = ''
  copied.value = false

  try {
    const res = await uploadImage(file)
    uploadedUrl.value = res.data.url
    uploadHistory.value.unshift({
      url: res.data.url,
      name: file.name,
    })
  } catch (e) {
    uploadError.value = e.message || '上传失败'
  } finally {
    uploading.value = false
  }
}

async function copyUrl() {
  await copyText(uploadedUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    urlInput.value.select()
    document.execCommand('copy')
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.upload-card {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: #2563eb;
  background: #eff6ff;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #9ca3af;
}

.upload-status {
  margin-top: 16px;
  text-align: center;
  color: #2563eb;
  font-size: 14px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #bfdbfe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-error {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.result-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.result-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.preview-wrapper {
  margin-bottom: 16px;
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.url-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-row label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  color: #6b7280;
  background: #f9fafb;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.result-hint {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 12px;
}

.history-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.history-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.history-item {
  text-align: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.history-thumb {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.history-name {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-text {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
}

.btn-text:hover {
  text-decoration: underline;
}
</style>
