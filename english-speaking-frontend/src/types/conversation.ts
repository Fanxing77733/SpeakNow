/**
 * 智能情景对话相关类型定义
 *
 * V1.0 支持 3 个场景 × 3 个难度 × 5 轮对话
 */

/** 对话场景枚举 */
export type Scene = 'self_intro' | 'campus_life' | 'restaurant'

/** 对话难度 */
export type ConversationDifficulty = 'beginner' | 'intermediate' | 'advanced'

/** 场景配置（中文标签 + 图标 + 描述） */
export interface SceneConfig {
  value: Scene
  emoji: string
  label: string
  description: string
}

/** 场景列表 */
export const SCENE_CONFIGS: SceneConfig[] = [
  {
    value: 'self_intro',
    emoji: '\u{1F44B}',
    label: '自我介绍',
    description: '认识新朋友，用英语介绍自己',
  },
  {
    value: 'campus_life',
    emoji: '\u{1F3EB}',
    label: '校园生活',
    description: '和同班同学聊聊学校日常',
  },
  {
    value: 'restaurant',
    emoji: '\u{1F37D}',
    label: '餐厅点餐',
    description: '用英语完成一次完整点餐体验',
  },
]

/** 难度标签 */
export const DIFFICULTY_LABELS: Record<ConversationDifficulty, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

/** 对话消息 */
export interface Message {
  round: number
  /** 消息角色 */
  role: 'user' | 'ai'
  /** 消息文本内容 */
  content: string
  /** 创建时间 */
  createdAt: string
}

/** 开始对话会话响应 */
export interface ConversationSession {
  sessionId: number
  scene: Scene
  status: string
  totalRounds: number
  firstMessage: Message
}

/** 发送消息响应（返回 AI 回复 + ASR 转写文本） */
export interface AIMessageResponse {
  round: number
  userText: string
  aiText: string
  sessionId: number
  totalRounds: number
}

/** 对话评分结果 */
export interface ScoreResult {
  sessionId: number
  grammarScore: number
  relevanceScore: number
  fluencyScore: number
  totalScore: number
  comment: string
}
