/**
 * 测评模块类型定义（V3.0：30题随机抽题 + CEFR 六级）
 */

/** 题目类型 */
export type QuestionType = 'vocab' | 'grammar' | 'reading' | 'listening'

/** 题目 VO */
export interface QuestionVO {
  id: number
  type: QuestionType
  questionText: string
  /** 听力原文（用于 TTS 语音合成，非听力题为 null） */
  transcript?: string | null
  /** JSON 数组字符串，如 [{"key":"A","text":"..."}] */
  optionsJson: string
  sortOrder: number
}

/** 选项 */
export interface Option {
  key: string
  text: string
}

/** 单题答案 */
export interface AnswerItem {
  questionId: number
  selectedKey: string
}

/** CEFR 等级 */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/** 测评结果 */
export interface AssessmentResult {
  recordId: number
  totalScore: number
  vocabScore: number
  grammarScore: number
  readingScore: number
  listeningScore: number
  cefrLevel: CefrLevel
  levelLabel: string
  message: string
  correctCount: number
  totalQuestions: number
}

/** 题型中文标签映射 */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  vocab: '词汇',
  grammar: '语法',
  reading: '阅读',
  listening: '听力',
}

/** CEFR 六级配置 */
export const CEFR_CONFIG: Record<CefrLevel, {
  label: string
  description: string
  color: string
  bgGradient: string
  ring: string
  textColor: string
}> = {
  A1: {
    label: '入门',
    description: 'A1 - Beginner',
    color: '#F59E0B',
    bgGradient: 'from-amber-300 to-amber-500',
    ring: 'ring-amber-400',
    textColor: 'text-amber-800',
  },
  A2: {
    label: '初级',
    description: 'A2 - Elementary',
    color: '#F97316',
    bgGradient: 'from-orange-300 to-orange-500',
    ring: 'ring-orange-400',
    textColor: 'text-orange-800',
  },
  B1: {
    label: '中级',
    description: 'B1 - Intermediate',
    color: '#3B82F6',
    bgGradient: 'from-blue-300 to-blue-500',
    ring: 'ring-blue-400',
    textColor: 'text-blue-800',
  },
  B2: {
    label: '中高级',
    description: 'B2 - Upper Intermediate',
    color: '#6366F1',
    bgGradient: 'from-indigo-300 to-indigo-500',
    ring: 'ring-indigo-400',
    textColor: 'text-indigo-800',
  },
  C1: {
    label: '高级',
    description: 'C1 - Advanced',
    color: '#0D9488',
    bgGradient: 'from-teal-300 to-teal-500',
    ring: 'ring-teal-400',
    textColor: 'text-teal-800',
  },
  C2: {
    label: '精通',
    description: 'C2 - Proficient',
    color: '#7C3AED',
    bgGradient: 'from-violet-300 to-violet-500',
    ring: 'ring-violet-400',
    textColor: 'text-violet-800',
  },
}
