/** 学习目标 */
export type GoalType = 'daily' | 'exam' | 'business'

/** 学习目标选项（供选择器使用） */
export const GOAL_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'daily', label: '日常交流', desc: '旅游、交友、日常对话' },
  { value: 'exam', label: '考试备考', desc: '四六级、雅思、托福等' },
  { value: 'business', label: '商务英语', desc: '面试、会议、邮件沟通' },
]

/** 用户信息 */
export interface User {
  id: number
  email: string
  phone?: string | null
  nickname?: string | null
  avatarUrl?: string | null
  age?: number | null
  goal?: GoalType | null
  /** 英语等级，如 beginner / intermediate / advanced / A1 / B2 */
  level?: string | null
  createdAt?: string
}

/** 登录请求 */
export interface LoginDTO {
  /** 账号：邮箱或手机号 */
  account: string
  password: string
}

/** 注册请求 */
export interface RegisterDTO {
  /** 邮箱，与手机号二选一 */
  email?: string
  /** 手机号，与邮箱二选一 */
  phone?: string
  /** 密码，8-20 位，至少含 1 字母 + 1 数字 */
  password: string
  /** 年龄，6-99 */
  age: number
  /** 学习目标 */
  goal: GoalType
}

/** 更新个人资料请求 */
export interface UpdateProfileDTO {
  nickname?: string
  age?: number
  goal?: GoalType
}
