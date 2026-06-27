/**
 * 学习进度 API
 *
 * 对接后端 /progress 接口，获取用户学习统计数据。
 */
import { request } from './client'
import type { ProgressSummaryResponse } from '../types/progress'

/**
 * 获取学习进度概览
 *
 * GET /api/v1/progress/summary
 * - 有数据时返回 { empty: false, summary: { totalPractices, totalDurationSeconds, highestScore, totalDurationFormatted } }
 * - 无数据时返回 { empty: true, summary: null }
 */
export async function getSummary(): Promise<ProgressSummaryResponse> {
  return request<ProgressSummaryResponse>({ method: 'GET', url: '/progress/summary' })
}
