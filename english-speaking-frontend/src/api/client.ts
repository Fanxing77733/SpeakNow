/**
 * Axios 实例 + 拦截器配置
 *
 * - baseURL: /api/v1
 * - timeout: 30s
 * - 请求拦截：自动附加 JWT Token
 * - 响应拦截：401 跳登录、网络错误友好提示
 * - GET 请求弱网自动重试 1 次
 */
import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/authStore'
import type { Result } from '../types/api'

/** 创建 Axios 实例 */
const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  // 不设置默认 Content-Type，让 Axios 根据 data 类型自动决定：
  //   JSON 数据 → application/json
  //   FormData  → multipart/form-data（含 boundary）
})

// ========== 请求拦截器 ==========
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// ========== 响应拦截器 ==========
client.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 401 未认证 → 清除 Token 并跳转登录页
    // 排除 /auth/login 和 /auth/register，这两个接口的 401 是业务错误（密码错误等），不应触发跳转
    const isAuthEndpoint = config?.url?.startsWith('/auth/login') || config?.url?.startsWith('/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout()
      const currentPath = window.location.pathname
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      return Promise.reject(error)
    }

    // 网络错误：GET 请求自动重试 1 次
    if (!error.response && config && config.method === 'get' && !config._retry) {
      config._retry = true
      return client(config)
    }

    // 网络错误（非 GET 或已重试过）
    if (!error.response) {
      // 使用 console.warn 记录，生产环境可替换为 Toast 通知
      console.warn('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    // 其他服务端错误：透传后端返回的 message
    return Promise.reject(error)
  },
)

/**
 * 通用请求函数，返回 Result<T> 中的 data 字段
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await client(config)
  const result = response.data as Result<T>
  return result.data
}

export default client
