/**
 * 情景角色扮演页（V2.0）
 *
 * 角色选择 → AI 开场 → 语音对话 → 评分
 * 与智能对话的区别：更强的角色沉浸感，独立入口
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useConversationStore } from '../../stores/conversationStore'
import { useRecorder } from '../../hooks/useRecorder'
import ScoreModal from '../../components/ScoreModal'
import Toast from '../../components/ui/Toast'
import { formatDuration } from '../../utils/format'
import { playAudioBlob } from '../../utils/audio'
import { synthesizeTTS } from '../../api/tts'
import type { Scene } from '../../types/conversation'

// ======================== 打字机效果组件 ========================

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  start?: boolean
}

const TypewriterText = ({ text, speed = 40, onComplete, start = true }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!start) return

    indexRef.current = 0
    setDisplayedText('')
    setIsComplete(false)

    timerRef.current = setInterval(() => {
      indexRef.current += 1
      if (indexRef.current > text.length) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setDisplayedText(text)
        setIsComplete(true)
        onCompleteRef.current?.()
        return
      }
      setDisplayedText(text.slice(0, indexRef.current))
    }, speed)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [text, speed, start])

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-text-bottom animate-recording-pulse" />
      )}
    </span>
  )
}

// ======================== 角色定义 ========================

interface RoleDef {
  id: Scene
  name: string
  emoji: string
  desc: string
  style: string
}

const ROLES: RoleDef[] = [
  { id: 'roleplay_interviewer', name: '面试官 John', emoji: '\u{1F454}', desc: '模拟英文工作面试场景，练习自我介绍和回答常见面试问题', style: '正式专业' },
  { id: 'roleplay_tourist', name: '旅行者 Lucy', emoji: '\u{1F9F3}', desc: '模拟国外旅行中的各种交流场景，如问路、点餐、购物等', style: '友好热情' },
  { id: 'roleplay_classmate', name: '同学 Emma', emoji: '\u{1F4DA}', desc: '模拟校园生活中的对话，讨论课程、社团活动、考试准备', style: '活泼随意' },
  { id: 'roleplay_doctor', name: '医生 Smith', emoji: '\u{1FA7A}', desc: '模拟就医场景，练习描述症状、理解医嘱等医疗英语', style: '专业温和' },
  { id: 'roleplay_business', name: '商务伙伴 Wang', emoji: '\u{1F4BC}', desc: '模拟商务会议、邮件沟通、项目讨论等职场英语场景', style: '正式干练' },
]

// ======================== 角色扮演页面 ========================

const RolePlayPage = () => {
  const store = useConversationStore()
  const { isRecording, duration, startRecording, stopRecording, error: recorderError } = useRecorder()

  const [selectedRole, setSelectedRole] = useState<Scene | null>(null)
  const [started, setStarted] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // 页面离开时停止语音播报
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  // 语音播报
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  // 打字机追踪
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1)
  const typingCompleteRef = useRef<Set<number>>(new Set())
  // 上传中
  const [isUploading, setIsUploading] = useState(false)

  const selectedRoleData = ROLES.find(r => r.id === selectedRole)

  // 自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store.messages])

  // 查找需要打字的最新 AI 消息
  useEffect(() => {
    for (let i = store.messages.length - 1; i >= 0; i--) {
      const msg = store.messages[i]
      if (msg.role === 'ai' && !typingCompleteRef.current.has(i)) {
        setTypingMessageIndex(i)
        return
      }
    }
    setTypingMessageIndex(-1)
  }, [store.messages])

  // 语音播报（后端 TTS + Web Speech API 降级）
  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return
    try {
      const blob = await synthesizeTTS(text)
      if (blob && blob.size > 0) {
        await playAudioBlob(blob)
        return
      }
    } catch {
      // 降级
    }
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utterance.voice = enVoice
    window.speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  // AI 消息打字完成 → 语音播报
  const handleTypingComplete = useCallback((messageIndex: number) => {
    typingCompleteRef.current.add(messageIndex)
    const msg = store.messages[messageIndex]
    if (msg && msg.role === 'ai') {
      speakText(msg.content)
    }
    setTypingMessageIndex(-1)
  }, [store.messages, speakText])

  /** 开始角色扮演 */
  async function handleStart() {
    if (!selectedRole) return
    try {
      await store.initSession(selectedRole, 'intermediate')
      setStarted(true)
    } catch {
      setToastMsg('启动失败，请稍后重试')
    }
  }

  /** 录音并发送 */
  const handleSend = useCallback(async () => {
    const blob = await stopRecording()
    if (!blob) return
    setIsUploading(true)
    try {
      await store.sendAudioMessage(blob, duration)
    } catch {
      setToastMsg('发送失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }, [stopRecording, duration, store])

  /** 结束对话 */
  async function handleEnd() {
    try {
      await store.finishConversation()
    } catch {
      setToastMsg('获取评分失败')
    }
  }

  /** 完成评分后 */
  function handleNewSession() {
    store.reset()
    setStarted(false)
    setSelectedRole(null)
    typingCompleteRef.current = new Set()
  }

  // ====== 角色选择页 ======
  if (!started) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">情景角色扮演</h1>
        <p className="text-sm text-gray-500 mb-6">选择一个角色，进入沉浸式的英语对话体验</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all
                ${selectedRole === role.id
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{role.emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  <span className="text-xs text-gray-400">{role.style}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{role.desc}</p>
            </button>
          ))}
        </div>

        {selectedRole && (
          <div className="mt-6 text-center">
            <button
              onClick={handleStart}
              disabled={store.isLoading}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium
                hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {store.isLoading ? '加载中...' : `开始与 ${selectedRoleData?.name} 对话`}
            </button>
          </div>
        )}

        {toastMsg && <Toast type="error" message={toastMsg} visible onClose={() => setToastMsg(null)} />}
      </div>
    )
  }

  // ====== 对话页 ======
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* 顶部角色信息 */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 mb-4 flex-shrink-0">
        <span className="text-2xl">{selectedRoleData?.emoji}</span>
        <div>
          <h2 className="font-semibold text-gray-900">{selectedRoleData?.name}</h2>
          <p className="text-xs text-gray-400">{selectedRoleData?.style} · 轮次 {store.currentRound}</p>
        </div>
        {/* 语音播报开关 */}
        <button
          type="button"
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`text-xs px-2 py-1 rounded-full transition-colors ${
            voiceEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}
          title={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
        >
          {voiceEnabled ? '🔊 语音' : '🔇 静音'}
        </button>
        <button
          onClick={handleEnd}
          disabled={store.isLoading || isUploading}
          className="ml-auto px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium
            hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          结束对话
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {store.messages.map((msg, idx) => {
          const isCurrentlyTyping = idx === typingMessageIndex
          return (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}
              >
                {msg.role === 'ai' && isCurrentlyTyping ? (
                  <TypewriterText
                    text={msg.content}
                    speed={40}
                    onComplete={() => handleTypingComplete(idx)}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          )
        })}
        {(store.isLoading || isUploading) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 录音区域 */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4">
        {/* 录音错误提示 */}
        {recorderError && (
          <p className="text-xs text-center text-red-500 mb-2">{recorderError}</p>
        )}

        <div className="flex items-center justify-center mb-2">
          {isRecording ? (
            <span className="text-red-500 font-medium animate-pulse mr-3">
              录音中 {formatDuration(duration)}
            </span>
          ) : (
            <span className="text-gray-400 text-sm mr-3">
              {isUploading ? '识别中...' : '按住按钮开始说话'}
            </span>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={handleSend}
            onMouseLeave={isRecording ? handleSend : undefined}
            onTouchStart={(e) => { e.preventDefault(); startRecording() }}
            onTouchEnd={(e) => { e.preventDefault(); handleSend() }}
            disabled={store.isLoading || isUploading || store.status === 'completed'}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
              ${isRecording
                ? 'bg-red-500 scale-110 shadow-lg shadow-red-200'
                : isUploading || store.status === 'completed'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
          >
            {isUploading ? (
              <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 mt-2">
          {isRecording ? '松手发送语音' : isUploading ? '正在识别你的语音...' : '长按按钮开始说话，松手发送'}
        </p>
      </div>

      {/* 评分弹窗 */}
      {store.status === 'completed' && store.scoreResult && (
        <ScoreModal
          visible
          scoreResult={store.scoreResult}
          onNewSession={handleNewSession}
          onClose={() => store.reset()}
        />
      )}

      {toastMsg && <Toast type="error" message={toastMsg} visible onClose={() => setToastMsg(null)} />}
    </div>
  )
}

export default RolePlayPage
