<template>
  <div class="site-info-edit">
    <div class="page-header">
      <h1>站点信息</h1>
      <button @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <div class="form-card">
        <!-- 站点名称 -->
        <div class="form-group">
          <label>站点名称</label>
          <input
            v-model="form.site_name"
            type="text"
            class="form-input"
            placeholder="我的博客"
          />
        </div>

        <!-- 作者名称 -->
        <div class="form-group">
          <label>作者名称</label>
          <input
            v-model="form.author_name"
            type="text"
            class="form-input"
            placeholder="博主昵称"
          />
        </div>

        <!-- 作者头像 -->
        <div class="form-group">
          <label>作者头像</label>
          <div class="avatar-section">
            <div class="avatar-preview">
              <img
                v-if="form.author_avatar"
                :src="form.author_avatar"
                alt="avatar"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                {{ avatarInitial }}
              </div>
            </div>
            <div class="avatar-controls">
              <input
                v-model="form.author_avatar"
                type="text"
                class="form-input"
                placeholder="输入头像图片 URL"
              />
              <button class="btn-upload" @click="triggerUpload">
                上传图片
              </button>
              <button v-if="form.author_avatar" class="btn-clear" @click="form.author_avatar = ''">
                清除
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style="display: none"
                @change="handleUpload"
              />
            </div>
          </div>
        </div>

        <!-- 作者简介 -->
        <div class="form-group">
          <label>作者简介</label>
          <textarea
            v-model="form.author_bio"
            class="form-textarea"
            rows="3"
            placeholder="一句话介绍自己"
          ></textarea>
        </div>

        <!-- 公告 -->
        <div class="form-group">
          <label>站点公告</label>
          <textarea
            v-model="form.announcement"
            class="form-textarea"
            rows="4"
            placeholder="公告内容（留空则不显示公告栏）"
          ></textarea>
        </div>
      </div>

      <div v-if="saveError" class="save-error">{{ saveError }}</div>
      <div v-if="saved" class="save-success">保存成功</div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getAdminSiteInfo, updateSiteInfo } from '@/api/config'
import { uploadImage } from '@/api/images'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()

const form = reactive({
  site_name: '',
  author_name: '',
  author_avatar: '',
  author_bio: '',
  announcement: '',
})

const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)
const fileInput = ref(null)

const avatarInitial = computed(() => {
  const name = form.author_name || '博'
  return name.charAt(0).toUpperCase()
})

async function loadSiteInfo() {
  loading.value = true
  try {
    const res = await getAdminSiteInfo()
    Object.assign(form, res.data)
  } catch (e) {
    console.error('加载站点信息失败:', e)
  } finally {
    loading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = '图片大小不能超过 5MB'
    return
  }
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    saveError.value = '仅支持 JPG/PNG/GIF/WebP 格式'
    return
  }
  saveError.value = ''

  try {
    const res = await uploadImage(file)
    if (res.data && res.data.url) {
      form.author_avatar = res.data.url
    } else {
      saveError.value = res.message || '上传失败'
    }
  } catch (err) {
    saveError.value = '头像上传失败: ' + (err.message || '未知错误')
  } finally {
    e.target.value = ''
  }
}

async function handleSave() {
  saving.value = true
  saveError.value = ''
  saved.value = false
  try {
    await updateSiteInfo({ ...form })
    // 刷新前台 store 缓存
    siteStore.siteInfoLoaded = false
    await siteStore.loadSiteInfo()
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e) {
    saveError.value = e.message || '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(loadSiteInfo)
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

.form-card {
  background: #fff;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  max-width: 640px;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #2563eb;
}

.form-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  border-color: #2563eb;
}

/* ---- 头像区域 ---- */
.avatar-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.avatar-preview {
  flex-shrink: 0;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 2px solid #e5e7eb;
}

.avatar-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-upload {
  display: inline-block;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  width: fit-content;
}

.btn-upload:hover {
  background: #e5e7eb;
}

.btn-clear {
  display: inline-block;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  width: fit-content;
}

.btn-clear:hover {
  background: #fee2e2;
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
