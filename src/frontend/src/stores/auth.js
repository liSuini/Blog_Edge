import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(username, password) {
      const res = await loginApi({ username, password })
      this.token = res.data.token
      localStorage.setItem('token', this.token)
      return res
    },

    logout() {
      this.token = null
      localStorage.removeItem('token')
      router.push('/admin/login')
    },
  },
})
