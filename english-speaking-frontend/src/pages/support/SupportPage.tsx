import { useState, useEffect, useRef } from 'react'
import type { FaqEntry } from '../../api/support'
import {
  getFAQList,
  searchFAQ,
  getHotFAQs,
  sendSupportMessage,
  submitFeedback,
  createTicket,
} from '../../api/support'

const FAQ_CATEGORIES: Record<string, string> = {
  account: '账号相关',
  feature: '功能使用',
  payment: '付费问题',
  tech: '技术故障',
  learning: '学习建议',
}

interface LocalMessage {
  role: string
  content: string
  confidence?: number | null
  isEscalated?: boolean
  ticketId?: number
}

export default function SupportPage() {
  const [faqList, setFaqList] = useState<FaqEntry[]>([])
  const [selectedFaq, setSelectedFaq] = useState<FaqEntry | null>(null)
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  // chat states
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // load FAQ on mount
  useEffect(() => {
    loadFAQs()
    loadHotFAQs()
  }, [activeCategory])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadFAQs() {
    try {
      const data = activeCategory ? await getFAQList(activeCategory) : await getFAQList()
      setFaqList(data)
    } catch {
      // ignore
    }
  }

  async function loadHotFAQs() {
    try {
      const hot = await getHotFAQs(5)
      setFaqList((prev) => {
        // deduplicate by id, keep existing first
        const existingIds = new Set(prev.map((f) => f.id))
        const newItems = hot.filter((f) => !existingIds.has(f.id))
        return [...prev, ...newItems]
      })
    } catch {
      // ignore
    }
  }

  async function handleSearch() {
    if (!searchText.trim()) {
      loadFAQs()
      return
    }
    try {
      const results = await searchFAQ(searchText.trim())
      setFaqList(results)
    } catch {
      // ignore
    }
  }

  async function handleSendMessage() {
    const text = inputText.trim()
    if (!text || loading) return
    setInputText('')

    const userMsg: LocalMessage = { role: 'USER', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const resp = await sendSupportMessage(text, sessionId || undefined)
      if (!sessionId) setSessionId(resp.sessionId)
      const aiMsg: LocalMessage = {
        role: 'AI',
        content: resp.message,
        confidence: resp.confidence,
        isEscalated: resp.escalated,
        ticketId: resp.ticketId || undefined,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: LocalMessage = {
        role: 'AI',
        content: '服务繁忙，请稍后重试。如需帮助，请联系人工客服。',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  async function handleFeedback(satisfied: boolean) {
    if (!sessionId) return
    try {
      await submitFeedback(sessionId, satisfied ? 1 : 0)
      const feedbackMsg: LocalMessage = {
        role: 'SYSTEM',
        content: satisfied ? '感谢您的反馈！' : '抱歉没能帮到您，正在为您转接人工客服...',
      }
      setMessages((prev) => [...prev, feedbackMsg])
      if (!satisfied) {
        try {
          await createTicket(sessionId)
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  function renderFaqContent() {
    if (selectedFaq) {
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => setSelectedFaq(null)}
            className="text-blue-600 hover:text-blue-700 text-sm mb-4 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{selectedFaq.question}</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {selectedFaq.answer}
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto p-4">
        {/* category filter */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => { setActiveCategory(''); setSelectedFaq(null) }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              !activeCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCategory === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-2">
          {faqList.map((faq) => (
            <button
              key={faq.id}
              onClick={() => setSelectedFaq(faq)}
              className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{faq.question}</div>
              <div className="text-xs text-gray-500 mt-1">{FAQ_CATEGORIES[faq.category] || faq.category}</div>
            </button>
          ))}
          {faqList.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">未找到相关 FAQ</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">帮助中心</h1>

      <div className="flex gap-6 min-h-[600px]">
        {/* Left: FAQ panel */}
        <div className="w-80 shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索 FAQ..."
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                onClick={handleSearch}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {renderFaqContent()}
        </div>

        {/* Right: Chat panel */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0">
          <div className="p-3 border-b">
            <h2 className="text-sm font-semibold text-gray-900">智能客服</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px]">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg mb-2">你好！我是 AI 英语口语训练系统的智能客服</p>
                <p className="text-sm">可以问我关于账号、功能使用、技术故障等问题</p>
                <p className="text-sm mt-1">也可以左侧浏览 FAQ 帮助中心</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'USER' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-2 bg-blue-600 text-white rounded-2xl rounded-br-md text-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : msg.role === 'AI' ? (
                  <div className="space-y-2">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-2 bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md text-sm">
                        {msg.content}
                      </div>
                    </div>
                    {/* Feedback buttons + escalation alert */}
                    {!msg.isEscalated && (
                      <div className="flex items-center gap-3 ml-1">
                        <span className="text-xs text-gray-400">这个回答是否解决了您的问题？</span>
                        <button
                          onClick={() => handleFeedback(true)}
                          className="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-green-50 hover:border-green-300"
                          title="满意"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleFeedback(false)}
                          className="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-red-50 hover:border-red-300"
                          title="不满意"
                        >
                          👎
                        </button>
                      </div>
                    )}
                    {msg.isEscalated && (
                      <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded ml-1 inline-block">
                        已为您创建人工工单（工单号：{msg.ticketId}），客服人员会尽快处理
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400 py-1">{msg.content}</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 bg-gray-100 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入问题..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
