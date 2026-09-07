<template>
  <div class="empty-state fade-in">
    <div class="empty-icon">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    </div>
    <p class="empty-text">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '暂无内容' },
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  color: var(--color-border);
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.empty-text {
  color: var(--color-muted);
  font-size: 15px;
  font-weight: 400;
}
</style>
