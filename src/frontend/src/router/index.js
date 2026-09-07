import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ---- 前台 ----
  {
    path: '/',
    component: () => import('@/components/common/FrontendLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/frontend/HomeView.vue'),
      },
      {
        path: 'article/:id',
        name: 'article-detail',
        component: () => import('@/views/frontend/ArticleDetailView.vue'),
      },
      {
        path: 'category/:slug',
        name: 'category',
        component: () => import('@/views/frontend/CategoryView.vue'),
      },
      {
        path: 'tag/:slug',
        name: 'tag',
        component: () => import('@/views/frontend/TagView.vue'),
      },
      {
        path: 'archives',
        name: 'archive',
        component: () => import('@/views/frontend/ArchiveView.vue'),
      },
      {
        path: 'categories',
        name: 'category-list',
        component: () => import('@/views/frontend/CategoryListPage.vue'),
      },
      {
        path: 'tags',
        name: 'tag-list',
        component: () => import('@/views/frontend/TagListPage.vue'),
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/frontend/AboutView.vue'),
      },
    ],
  },
  // ---- 后台 ----
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/components/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
      },
      {
        path: 'articles',
        name: 'admin-articles',
        component: () => import('@/views/admin/ArticleListView.vue'),
      },
      {
        path: 'articles/new',
        name: 'admin-article-new',
        component: () => import('@/views/admin/ArticleEditView.vue'),
      },
      {
        path: 'articles/:id/edit',
        name: 'admin-article-edit',
        component: () => import('@/views/admin/ArticleEditView.vue'),
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('@/views/admin/CategoryListView.vue'),
      },
      {
        path: 'tags',
        name: 'admin-tags',
        component: () => import('@/views/admin/TagListView.vue'),
      },
      {
        path: 'images',
        name: 'admin-images',
        component: () => import('@/views/admin/ImageView.vue'),
      },
      {
        path: 'about',
        name: 'admin-about',
        component: () => import('@/views/admin/AboutEditView.vue'),
      },
      {
        path: 'site-info',
        name: 'admin-site-info',
        component: () => import('@/views/admin/SiteInfoEditView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

// 认证守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth || to.matched.some((r) => r.meta.requiresAuth)) {
    if (!token) {
      next('/admin/login')
      return
    }
  }
  // 已登录访问登录页则跳转仪表盘
  if (to.name === 'admin-login' && token) {
    next('/admin')
    return
  }
  next()
})

export default router
