<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <router-link to="/admin">博客管理后台</router-link>
      </div>
      <AdminSidebar />
    </aside>

    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1f2937;
  color: #d1d5db;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid #374151;
}

.sidebar-header a {
  color: #fff;
  text-decoration: none;
}

.admin-main {
  flex: 1;
  background: #f3f4f6;
  padding: 32px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .sidebar-header {
    font-size: 0;
    padding: 20px 0;
    text-align: center;
  }

  .sidebar-header a::before {
    content: 'B';
    font-size: 18px;
  }

  .sidebar-nav a {
    padding: 12px 0;
    text-align: center;
    font-size: 0;
  }
}
</style>
