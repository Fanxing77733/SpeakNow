/**
 * 校验邮箱格式
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 校验密码强度
 * 规则：≥6 位，至少包含一个字母和一个数字
 * 返回 null 表示校验通过，否则返回错误提示
 */
export function isValidPassword(password: string): string | null {
  if (!password) return '请输入密码'
  if (password.length < 6) return '密码至少需要 6 个字符'
  if (!/[a-zA-Z]/.test(password)) return '密码需要包含字母'
  if (!/\d/.test(password)) return '密码需要包含数字'
  return null
}

/**
 * 校验昵称
 */
export function isValidNickname(nickname: string): string | null {
  if (!nickname || nickname.trim().length === 0) return '请输入昵称'
  if (nickname.length > 20) return '昵称最多 20 个字符'
  return null
}

/**
 * 文本长度限制（防注入，最大 500 字符）
 */
export const MAX_TEXT_LENGTH = 500

export function isTextTooLong(text: string): boolean {
  return text.length > MAX_TEXT_LENGTH
}
