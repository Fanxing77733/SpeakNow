// TODO: 生产环境替换为 httpOnly Cookie，当前开发阶段使用 localStorage 存 JWT Token
import { create } from 'zustand'
import axios from 'axios'
import type { User, LoginDTO, RegisterDTO, UpdateProfileDTO } from '../types/auth'
import * as authApi from '../api/auth'

interface AuthState {
  /** JWT Token */
  token: string | null
  /** 当前用户信息 */
  user: User | null
  /** 是否已认证 */
  isAuthenticated: boolean
  /** 认证操作加载状态 */
  isLoading: boolean
  /** 操作错误信息 */
  error: string | null

  /** 设置认证信息 */
  setAuth: (token: string, user: User) => void
  /** 登录 */
  login: (dto: LoginDTO) => Promise<void>
  /** 注册（注册成功自动登录） */
  register: (dto: RegisterDTO) => Promise<void>
  /** 登出 */
  logout: () => void
  /** 获取当前用户资料 */
  fetchProfile: () => Promise<void>
  /** 更新用户资料 */
  updateProfile: (dto: UpdateProfileDTO) => Promise<void>
  /** 清除错误 */
  clearError: () => void
  /** 检查认证状态 */
  checkAuth: () => boolean
}

/**
 * 从 axios 错误中提取用户友好的错误消息
 * 禁止展示技术术语，根据 HTTP 状态码映射为友好文案
 */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const serverMsg = (error.response?.data as { message?: string })?.message

    // 优先使用后端返回的友好文案
    if (serverMsg && !serverMsg.includes('error') && !serverMsg.includes('exception')) {
      return serverMsg
    }

    // 按状态码映射友好文案
    switch (status) {
      case 400:
        return '请检查输入信息是否正确'
      case 401:
        return '密码错误，请重试'
      case 403:
        return '账号已被临时锁定，请 30 分钟后再试'
      case 404:
        return '账号不存在，请先注册'
      case 409:
        return '该邮箱或手机号已注册，请直接登录'
      case 422:
        return '提交的数据不符合要求，请检查后重试'
      case 429:
        return '操作过于频繁，请稍后再试'
      case 500:
      case 502:
      case 503:
        return '服务繁忙，请稍后重试'
      default:
        return '请求失败，请稍后重试'
    }
  }

  // 网络错误（无响应）
  if (error instanceof Error && error.message === 'Network Error') {
    return '网络连接失败，请检查网络'
  }

  return '操作失败，请稍后重试'
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 初始状态：从 localStorage 恢复 Token（开发阶段）
  token: localStorage.getItem('auth_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  setAuth: (token: string, user: User) => {
    // 开发阶段存 localStorage
    localStorage.setItem('auth_token', token)
    set({ token, user, isAuthenticated: true, error: null })
  },

  login: async (dto: LoginDTO) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.login(dto)
      get().setAuth(res.token, res.user)
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
    set({ isLoading: false })
  },

  register: async (dto: RegisterDTO) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.register(dto)
      get().setAuth(res.token, res.user)
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
    set({ isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    set({ token: null, user: null, isAuthenticated: false, error: null })
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const user = await authApi.getProfile()
      set({ user, isLoading: false })
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  updateProfile: async (dto: UpdateProfileDTO) => {
    set({ isLoading: true, error: null })
    try {
      const user = await authApi.updateProfile(dto)
      set({ user, isLoading: false })
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  clearError: () => {
    set({ error: null })
  },

  checkAuth: () => {
    return get().isAuthenticated
  },
}))
