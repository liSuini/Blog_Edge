<template>
  <footer class="app-footer">
    <div class="container">
      <p>&copy; {{ year }} {{ siteName }}. Powered by EdgeOne + Vue3.</p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()
const siteName = computed(() => siteStore.config?.site_name || 'My Blog')
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-light);
  padding: 24px 0;
  text-align: center;
}

.app-footer p {
  color: var(--color-muted);
  font-size: 13px;
  letter-spacing: 0.02em;
}
</style>
