<template>
  <div class="toc-wrapper" v-if="headings.length">
    <div class="toc-card">
      <h4 class="toc-title" @click="toggleAll">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        目录
        <span class="toggle-all-icon" :class="{ collapsed: allCollapsed }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </h4>
      <ul class="toc-list" v-show="!allCollapsed">
        <template v-for="(item, index) in headings" :key="item.id">
          <!-- 二级标题：可折叠的分组 -->
          <li
            v-if="item.level === 2"
            :class="['toc-item', 'toc-level-2', { active: activeId === item.id }]"
            @click="scrollToHeading(item.id)"
          >
            <span
              v-if="hasChildren(index)"
              class="collapse-arrow"
              :class="{ collapsed: collapsedGroups[item.id] }"
              @click.stop="toggleGroup(item.id)"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
            <span class="toc-text">{{ item.text }}</span>
          </li>
          <!-- 三级标题：归属上级分组，受折叠状态控制 -->
          <li
            v-if="item.level === 3"
            v-show="isGroupOpen(getParentId(index))"
            :class="['toc-item', 'toc-level-3', { active: activeId === item.id }]"
            @click="scrollToHeading(item.id)"
          >
            <span class="toc-text">{{ item.text }}</span>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
})

const headings = ref([])
const activeId = ref('')
const collapsedGroups = reactive({})
const allCollapsed = ref(false)
const headingElements = ref([])
let observer = null

// 从 Markdown 原文提取标题（## 和 ###）
function extractHeadings() {
  if (!props.content) return []
  const lines = props.content.split('\n')
  const result = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{2,3})\s+(.+)/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[`*~_]/g, '').trim()
      const id = generateId(text)
      result.push({ level, text, id })
    }
  }
  return result
}

function generateId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// 判断某个二级标题后面是否有三级子标题
function hasChildren(index) {
  if (index + 1 >= headings.value.length) return false
  return headings.value[index + 1].level === 3
}

// 获取三级标题所属的二级标题 id
function getParentId(index) {
  for (let i = index; i >= 0; i--) {
    if (headings.value[i].level === 2) {
      return headings.value[i].id
    }
  }
  return ''
}

// 判断分组是否展开（未折叠 = 展开）
function isGroupOpen(groupId) {
  if (!groupId) return true
  return !collapsedGroups[groupId]
}

// 切换某个分组的折叠/展开
function toggleGroup(groupId) {
  collapsedGroups[groupId] = !collapsedGroups[groupId]
}

// 切换整个目录的折叠/展开
function toggleAll() {
  allCollapsed.value = !allCollapsed.value
}

function scrollToHeading(id) {
  const el = document.getElementById(id)
  if (el) {
    const headerHeight = 36
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 10
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function setupObserver() {
  headingElements.value = headings.value
    .map(h => document.getElementById(h.id))
    .filter(Boolean)

  if (observer) observer.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length > 0) {
        const top = visible.reduce((min, e) =>
          e.boundingClientRect.top < min.boundingClientRect.top ? e : min
        )
        activeId.value = top.target.id
      }
    },
    {
      rootMargin: '-50px 0px -70% 0px',
      threshold: 0,
    }
  )

  headingElements.value.forEach(el => observer.observe(el))
}

function onScroll() {
  if (headingElements.value.length === 0) return
  let current = ''
  for (const el of headingElements.value) {
    if (el.getBoundingClientRect().top < 80) {
      current = el.id
    }
  }
  // 滚动到某个三级标题时，自动展开其父分组
  if (current) {
    activeId.value = current
    const idx = headings.value.findIndex(h => h.id === current)
    if (idx >= 0 && headings.value[idx].level === 3) {
      const parentId = getParentId(idx)
      if (parentId && collapsedGroups[parentId]) {
        collapsedGroups[parentId] = false
      }
    }
  }
}

onMounted(async () => {
  headings.value = extractHeadings()
  await nextTick()
  setTimeout(() => {
    setupObserver()
    onScroll()
  }, 300)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('scroll', onScroll)
})

watch(() => props.content, async () => {
  headings.value = extractHeadings()
  // 重置折叠状态
  Object.keys(collapsedGroups).forEach(k => delete collapsedGroups[k])
  allCollapsed.value = false
  await nextTick()
  setTimeout(() => {
    setupObserver()
    onScroll()
  }, 300)
})
</script>

<style scoped>
.toc-wrapper {
  position: sticky;
  top: 40px;
  max-height: calc(100vh - 50px);
  overflow-y: auto;
}

.toc-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 12px;
  box-shadow: var(--shadow-sm);
}

.toc-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.toc-title:hover {
  color: var(--color-primary);
}

.toc-title svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.toggle-all-icon {
  margin-left: auto;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
  color: var(--color-muted);
}

.toggle-all-icon.collapsed {
  transform: rotate(-90deg);
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-secondary);
  cursor: pointer;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  border-left: 2px solid transparent;
  margin-bottom: 1px;
}

.toc-level-2 {
  font-weight: 500;
}

.toc-level-3 {
  padding-left: 22px;
  font-size: 11px;
  color: var(--color-muted);
}

.collapse-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-right: 2px;
  border-radius: 3px;
  transition: transform 0.2s ease, background var(--transition-fast);
  color: var(--color-muted);
}

.collapse-arrow:hover {
  background: var(--color-border-light);
  color: var(--color-primary);
}

.collapse-arrow.collapsed {
  transform: rotate(-90deg);
}

.toc-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-item:hover {
  color: var(--color-primary);
  background: var(--color-primary-alpha);
}

.toc-item.active {
  color: var(--color-primary);
  font-weight: 600;
  border-left-color: var(--color-primary);
  background: var(--color-primary-alpha);
}

/* 滚动条美化 */
.toc-wrapper::-webkit-scrollbar {
  width: 4px;
}

.toc-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.toc-wrapper::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-full);
}
</style>
