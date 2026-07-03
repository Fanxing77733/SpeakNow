import { request } from './client'

export interface FaqEntry {
  id: number
  category: string
  question: string
  answer: string
  sortOrder: number
  clickCount: number
}

export interface SupportChatResp {
  sessionId: number
  message: string
  confidence: number
  escalated: boolean
  ticketId: number | null
}

export interface ChatMessageItem {
  role: string
  content: string
  confidence: number | null
  createdAt: string
}

export interface ChatHistoryVO {
  sessionId: number
  status: string
  satisfaction: number | null
  messages: ChatMessageItem[]
}

/** 按分类列出 FAQ */
export function getFAQList(category?: string): Promise<FaqEntry[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : ''
  return request({ url: `/support/faq${params}` })
}

/** 搜索 FAQ */
export function searchFAQ(keyword: string): Promise<FaqEntry[]> {
  return request({ url: '/support/faq/search', params: { keyword } })
}

/** 热门 FAQ */
export function getHotFAQs(limit = 5): Promise<FaqEntry[]> {
  return request({ url: '/support/faq/hot', params: { limit } })
}

/** 发送客服消息 */
export function sendSupportMessage(message: string, sessionId?: number): Promise<SupportChatResp> {
  return request({
    method: 'POST',
    url: '/support/chat',
    data: { message, sessionId },
  })
}

/** 获取聊天历史 */
export function getChatHistory(sessionId: number): Promise<ChatHistoryVO> {
  return request({ url: `/support/chat/history/${sessionId}` })
}

/** 满意度反馈 */
export function submitFeedback(sessionId: number, rating: number): Promise<void> {
  return request({
    method: 'POST',
    url: `/support/chat/${sessionId}/feedback?rating=${rating}`,
  })
}

/** 创建人工工单 */
export function createTicket(sessionId?: number): Promise<number> {
  const params = sessionId ? `?sessionId=${sessionId}` : ''
  return request({ method: 'POST', url: `/support/chat/ticket${params}` })
}
