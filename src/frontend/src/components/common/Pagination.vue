<template>
  <nav v-if="totalPages > 1" class="pagination">
    <button
      class="page-btn nav-btn"
      :disabled="page <= 1"
      @click="go(page - 1)"
    >
      上一页
    </button>

    <template v-for="p in displayPages" :key="p">
      <span v-if="p === '...'" class="ellipsis">···</span>
      <button
        v-else
        class="page-btn"
        :class="{ active: p === page }"
        @click="go(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      class="page-btn nav-btn"
      :disabled="page >= totalPages"
      @click="go(page + 1)"
    >
      下一页
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})

const emit = defineEmits(['change'])

const displayPages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
})

function go(p) {
  if (p >= 1 && p <= props.totalPages && p !== props.page) {
    emit('change', p)
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 40px;
  padding: 8px 0;
}

.page-btn {
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-alpha);
  transform: translateY(-1px);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.nav-btn {
  padding: 0 16px;
  font-size: 13px;
}

.ellipsis {
  color: var(--color-muted);
  padding: 0 6px;
  font-size: 14px;
  letter-spacing: 2px;
}

@media (max-width: 480px) {
  .nav-btn {
    padding: 0 12px;
    font-size: 12px;
  }

  .page-btn {
    min-width: 34px;
    height: 34px;
    font-size: 13px;
  }
}
</style>
