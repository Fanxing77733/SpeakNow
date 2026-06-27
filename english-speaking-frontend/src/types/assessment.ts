/**
 * 测评模块类型定义
 *
 * V1.0: 20题固定测评，四类题型各5题，总分定级三档
 */

/** 题目类型 */
export type QuestionType = 'vocab' | 'grammar' | 'reading' | 'listening'

/** 题目 VO — 对应后端 QuestionVO（correct_answer 已被后端过滤） */
export interface QuestionVO {
  id: number
  type: QuestionType
  questionText: string
  /** JSON 数组字符串，如 [{"key":"A","text":"..."}] */
  optionsJson: string
  sortOrder: number
}

/** 选项 */
export interface Option {
  key: string
  text: string
}

/** 单题答案 — 提交给后端 */
export interface AnswerItem {
  questionId: number
  /** 用户选择的选项 key，超时为空字符串 */
  selectedKey: string
}

/** 测评结果 — 对应后端 AssessmentResultVO */
export interface AssessmentResult {
  recordId: number
  totalScore: number
  vocabScore: number
  grammarScore: number
  readingScore: number
  listeningScore: number
  resultLevel: 'beginner' | 'intermediate' | 'advanced'
  message: string
}

/** 题型中文标签映射 */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  vocab: '词汇',
  grammar: '语法',
  reading: '阅读',
  listening: '听力',
}

/** 评级配置 — 徽章样式 */
export const LEVEL_CONFIG: Record<string, {
  label: string
  badgeLabel: string
  ring: string
  text: string
  bgGradient: string
  barColor: string
}> = {
  beginner: {
    label: '初级',
    badgeLabel: 'Beginner',
    ring: 'ring-amber-400',
    text: 'text-amber-800',
    bgGradient: 'from-amber-300 to-amber-500',
    barColor: 'bg-amber-400',
  },
  intermediate: {
    label: '中级',
    badgeLabel: 'Intermediate',
    ring: 'ring-slate-400',
    text: 'text-slate-700',
    bgGradient: 'from-slate-300 to-slate-500',
    barColor: 'bg-slate-400',
  },
  advanced: {
    label: '高级',
    badgeLabel: 'Advanced',
    ring: 'ring-yellow-500',
    text: 'text-yellow-800',
    bgGradient: 'from-yellow-400 to-yellow-600',
    barColor: 'bg-yellow-500',
  },
}
