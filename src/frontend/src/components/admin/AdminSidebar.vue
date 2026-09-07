<template>
  <nav class="sidebar-nav">
    <router-link to="/admin" exact>仪表盘</router-link>
    <router-link to="/admin/articles">文章管理</router-link>
    <router-link to="/admin/categories">分类管理</router-link>
    <router-link to="/admin/tags">标签管理</router-link>
    <router-link to="/admin/images">图片上传</router-link>
    <router-link to="/admin/about">关于页</router-link>
    <router-link to="/admin/site-info">站点信息</router-link>
    <router-link to="/" target="_blank">访问前台</router-link>
    <a href="javascript:void(0)" @click="handleLogout">退出登录</a>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
}
</script>

<style scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
}

.sidebar-nav a {
  display: block;
  padding: 12px 20px;
  color: #d1d5db;
  font-size: 14px;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.sidebar-nav a:hover {
  background: #374151;
  color: #fff;
  text-decoration: none;
}

.sidebar-nav a.router-link-exact-active {
  background: #2563eb;
  color: #fff;
}
</style>
