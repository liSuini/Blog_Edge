<template>
  <header class="app-header" :class="{ 'nav-hidden': !visible }">
    <div class="container">
      <router-link to="/" class="logo">
        <span class="logo-icon">,</span>
        <span class="logo-text">{{ siteName }}</span>
      </router-link>
      <nav class="nav">
        <router-link to="/" class="nav-link" exact>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          首页
        </router-link>
        <router-link to="/archives" class="nav-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          归档
        </router-link>
        <router-link to="/categories" class="nav-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          分类
        </router-link>
        <router-link to="/tags" class="nav-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          标签
        </router-link>
        <router-link to="/about" class="nav-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          关于
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()
const siteName = computed(() => siteStore.siteInfo?.site_name || 'My Blog')

const visible = ref(true)
let lastScrollY = 0
let ticking = false

function handleScroll() {
  const currentY = window.scrollY
  if (currentY < 80) {
    visible.value = true
  } else if (currentY > lastScrollY && currentY > 80) {
    // 向下�?�?收起
    visible.value = false
  } else if (currentY < lastScrollY) {
    // 向上�?�?显示
    visible.value = true
  }
  lastScrollY = currentY
  ticking = false
}

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(handleScroll)
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.app-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-xs);
  border-bottom: 1px solid var(--color-border-light);
  padding: 1px 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: transform 0.3s ease, box-shadow var(--transition);
}

.app-header.nav-hidden {
  transform: translateY(-100%);
}

.app-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ---- Logo ---- */
.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.02em;
  transition: opacity var(--transition-fast);
}

.logo:hover {
  color: var(--color-heading);
  opacity: 0.8;
}

.logo-icon {
  font-size: 22px;
  font-weight: 900;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 0.8;
  transform: translateY(-2px);
}

/* ---- 导航 ---- */
.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--color-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transform: translateX(-50%);
  transition: width var(--transition);
}

.nav-link:hover {
  color: var(--color-primary);
  background: var(--color-primary-alpha);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
}

.nav-link.router-link-active::after {
  width: 60%;
}

/* ---- 移动�?---- */
@media (max-width: 640px) {
  .app-header {
    padding: 1px 0;
  }

  .logo-text {
    font-size: 14px;
  }

  .nav {
    gap: 0;
  }

  .nav-link {
    padding: 1px 4px;
    font-size: 11px;
  }

  .nav-link svg {
    display: none;
  }
}
</style>
