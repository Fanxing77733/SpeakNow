/**
 * 学习进度状态管理
 *
 * 管理学习进度概览数据的加载/缓存/错误状态。
 * 页面离开时不持久化，每次进入重新获取。
 */
import { create } from 'zustand'
import type { ProgressSummaryResponse } from '../types/progress'
import * as progressApi from '../api/progress'

interface ProgressState {
  /** 学习进度概览数据 */
  summary: ProgressSummaryResponse | null
  /** 是否正在加载 */
  isLoading: boolean
  /** 错误信息（友好文案） */
  error: string | null

  /** 获取学习进度概览 */
  fetchSummary: () => Promise<void>
  /** 重置状态（页面离开时清理） */
  reset: () => void
}

export const useProgressStore = create<ProgressState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await progressApi.getSummary()
      set({ summary: data, isLoading: false })
    } catch {
      set({ error: '加载学习数据失败，请稍后重试', isLoading: false })
    }
  },

  reset: () => {
    set({ summary: null, isLoading: false, error: null })
  },
}))
