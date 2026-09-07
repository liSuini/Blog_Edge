<template>
  <MdEditor
    v-model="modelValue"
    :preview="false"
    language="zh-CN"
    :toolbars="toolbars"
    :on-upload-img="handleUploadImg"
    placeholder="请输入 Markdown 正文..."
    style="height: 500px"
  />
</template>

<script setup>
import { computed } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadImage } from '@/api/images'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const toolbars = [
  'bold', 'underline', 'italic', 'strikeThrough',
  '-',
  'title', 'quote', 'unorderedList', 'orderedList', 'task',
  '-',
  'code', 'codeRow', 'link', 'image', 'table',
  '=',
  'preview', 'fullscreen',
]

async function handleUploadImg(files, callback) {
  const results = []
  for (const file of files) {
    try {
      const res = await uploadImage(file)
      results.push({ url: res.data.url, alt: file.name })
    } catch (e) {
      console.error('图片上传失败:', e)
    }
  }
  callback(results)
}
</script>
