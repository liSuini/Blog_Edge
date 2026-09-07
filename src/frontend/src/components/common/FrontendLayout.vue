<template>
  <div class="frontend-layout">
    <AppHeader />

    <main class="app-main">
      <div class="container layout-grid">
        <div class="layout-main">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>

        <div class="layout-sidebar">
          <BlogSidebar />
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import BlogSidebar from '@/components/common/BlogSidebar.vue'
</script>

<style scoped>
.frontend-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 40px 0 56px;
  margin-top: 30px;
}

/* ---- 页面过渡动画 ---- */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 960px) {
  .app-main {
    padding: 24px 0 40px;
  }
}
</style>