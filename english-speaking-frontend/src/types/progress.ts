/**
 * 学习进度相关类型定义
 */

/** 学习进度概览数据 */
export interface ProgressSummaryData {
  /** 总练习次数 */
  totalPractices: number
  /** 总学习时长（秒） */
  totalDurationSeconds: number
  /** 历史最高分 */
  highestScore: number
  /** 格式化后的总学习时长，如 "1h 2m" */
  totalDurationFormatted: string
}

/** 学习进度概览 API 响应 */
export interface ProgressSummaryResponse {
  /** 是否为空（新用户无数据） */
  empty: boolean
  /** 概览数据，empty 为 true 时为 null */
  summary: ProgressSummaryData | null
}
