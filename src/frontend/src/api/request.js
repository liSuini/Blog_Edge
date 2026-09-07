import axios from 'axios'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
})

// 请求拦截器：自动注入 Bearer Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：401 自动跳转登录页
request.interceptors.response.use(
  (response) => {
    const data = response.data
    // 后端统一返回 { code, message, data }
    if (data.code && data.code !== 200) {
      if (data.code === 40101) {
        // Token 无效或过期
        localStorage.removeItem('token')
        router.push('/admin/login')
      }
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      router.push('/admin/login')
    }
    return Promise.reject(error)
  }
)

export default request
