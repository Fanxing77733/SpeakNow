export interface SpeechTopic {
  id: number
  title: string
  description: string
  category: string
  difficulty: string
  preparationSeconds: number
  speechSecondsMin: number
  speechSecondsMax: number
}

export interface SpeechEvalResult {
  sessionId: number
  asrText: string
  grammarScore: number
  contentScore: number
  fluencyScore: number
  pronunciationScore: number
  totalScore: number
  comment: string
}

export const SPEECH_CATEGORIES: Record<string, string> = {
  daily: '日常生活',
  campus: '校园学习',
  business: '职场商务',
  social: '社会话题',
}

export const SPEECH_DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}
