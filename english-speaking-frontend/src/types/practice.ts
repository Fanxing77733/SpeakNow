/**
 * 发音评测相关类型定义
 */

/** 跟读内容句子 */
export interface ContentSentence {
  id: number
  sentence: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
}

/** 音素级评测结果 */
export interface PhonemeResult {
  phoneme: string
  score: number
}

/** 单词级评测结果 */
export interface WordResult {
  word: string
  score: number
  color: 'green' | 'yellow' | 'red'
  phonemes: PhonemeResult[]
}

/** 发音评测完整结果（映射 PronounceEvalResultVO） */
export interface PronounceEvalResult {
  recordId: number
  asrText: string
  totalScore: number
  accuracyScore: number
  fluencyScore: number
  completenessScore: number
  wordResults: WordResult[]
}

/** 难度等级 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/** 练习页状态枚举 */
export type PracticeStatus = 'idle' | 'recording' | 'uploading' | 'error'
