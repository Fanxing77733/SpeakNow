/**
 * 智能情景对话 — 对话页
 *
 * AI 实时对话核心页面，功能包括：
 * - 对话气泡区：用户右侧蓝色、AI 左侧灰色，AI 消息打字机效果逐字渲染
 * - Push-to-Talk 录音按钮（长按说话，松手发送）
 * - 5 轮固定对话，第 5 轮结束后自动评分
 * - 评分弹窗展示总分 + 三维分 + 文字评语
 * - 安全要求：用户输入只展示 ASR 转写文本，对话历史不持久化
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ScoreModal from '../../components/ScoreModal'
import Toast from '../../components/ui/Toast'
import Skeleton from '../../components/ui/Skeleton'
import { useConversationStore } from '../../stores/conversationStore'
import { useRecorder } from '../../hooks/useRecorder'
import { formatDuration } from '../../utils/format'
import { SCENE_CONFIGS, DIFFICULTY_LABELS } from '../../types/conversation'
import type { Scene, ConversationDifficulty } from '../../types/conversation'

// ======================== 打字机效果组件 ========================

interface TypewriterTextProps {
  /** 完整文本 */
  text: string
  /** 每字符显示间隔（ms） */
  speed?: number
  /** 打字完成回调 */
  onComplete?: () => void
  /** 是否立即开始打字 */
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

    // 重置
    indexRef.current = 0
    setDisplayedText('')
    setIsComplete(false)

    timerRef.current = setInterval(() => {
      indexRef.current += 1
      if (indexRef.current > text.length) {
        // 打字完成
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

// ======================== 对话页面 ========================

const ConversationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // 从路由 state 获取场景信息（用于 UI 展示）
  const routeState = location.state as
    | { scene?: Scene; difficulty?: ConversationDifficulty }
    | undefined
  const scene = routeState?.scene
  const difficulty = routeState?.difficulty

  // 场景配置（用于顶部展示）
  const sceneConfig = SCENE_CONFIGS.find((s) => s.value === scene)
  const difficultyLabel = difficulty ? DIFFICULTY_LABELS[difficulty] : ''

  // ===================== Store 状态 =====================
  const {
    messages,
    currentRound,
    totalRounds,
    status,
    scoreResult,
    isLoading,
    error,
    sendAudioMessage,
    finishConversation,
    reset: resetStore,
    clearError,
  } = useConversationStore()

  // ===================== 录音 =====================
  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error: recorderError,
    reset: resetRecorder,
  } = useRecorder()

  // ===================== 本地状态 =====================
  /** 评分弹窗可见性 */
  const [showScoreModal, setShowScoreModal] = useState(false)
  /** 错误 Toast 可见性 */
  const [showToast, setShowToast] = useState(false)
  /** 当前正在打字的 AI 消息索引（-1 表示无） */
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1)
  /** 是否处于上传中（录音结束 → 等待 API 返回） */
  const [isUploading, setIsUploading] = useState(false)
  /** 已完成的打字消息索引集合 */
  const typingCompleteRef = useRef<Set<number>>(new Set())
  /** 用户已发送轮次数 */
  const userTurnCountRef = useRef(0)
  /** 是否已触发自动结束 */
  const autoEndTriggeredRef = useRef(false)
  /** 最新录音时长（ref 同步，避免闭包过期） */
  const durationRef = useRef(0)

  // 同步 duration → ref
  useEffect(() => { durationRef.current = duration }, [duration])

  // ===================== Refs =====================
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ===================== 自动滚动到最新消息 =====================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ===================== 页面离开时仅清理录音资源（保留会话状态） =====================
  useEffect(() => {
    return () => {
      resetRecorder()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===================== 评分完成 → 显示弹窗 =====================
  useEffect(() => {
    if (status === 'completed' && scoreResult) {
      // 稍微延迟，让用户看到最后的消息
      const timer = setTimeout(() => {
        setShowScoreModal(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [status, scoreResult])

  // ===================== 错误 → 显示 Toast =====================
  useEffect(() => {
    if (error) {
      setShowToast(true)
      setIsUploading(false)
      resetRecorder()
    }
  }, [error, resetRecorder])

  // ===================== 录音 → 直接发送 =====================
  const submitBlob = useCallback(async (blob: Blob, dur: number) => {
    setIsUploading(true)
    userTurnCountRef.current += 1
    await sendAudioMessage(blob, dur)
    setIsUploading(false)
    resetRecorder()
  }, [sendAudioMessage, resetRecorder])

  // ===================== 查找需要打字的最新 AI 消息 =====================
  useEffect(() => {
    // 从后往前找第一个未完成打字的 AI 消息
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === 'ai' && !typingCompleteRef.current.has(i)) {
        setTypingMessageIndex(i)
        return
      }
    }
    setTypingMessageIndex(-1)
  }, [messages])

  /** 语音播报开关 */
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  // ===================== 语音播报 AI 回复 =====================
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return
    // 取消之前未完成的播报
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    // 找英文语音
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utterance.voice = enVoice
    window.speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  // ===================== AI 消息打字完成回调 =====================
  const handleTypingComplete = useCallback(
    (messageIndex: number) => {
      typingCompleteRef.current.add(messageIndex)

      // 语音播报 AI 回复
      const msg = messages[messageIndex]
      if (msg && msg.role === 'ai') {
        speakText(msg.content)
      }

      // 检查是否应该自动结束对话
      // 条件：用户已发送 5 轮 + 最后一轮 AI 回复已完成 + 尚未触发自动结束
      if (
        userTurnCountRef.current >= totalRounds &&
        !autoEndTriggeredRef.current
      ) {
        // 检查是否最后一轮 AI 回复已完成打字
        const lastAiMessage = messages[messages.length - 1]
        const lastIndex = messages.length - 1
        if (
          lastAiMessage?.role === 'ai' &&
          typingCompleteRef.current.has(lastIndex)
        ) {
          autoEndTriggeredRef.current = true
          // 延迟一小段，让用户看到完整的最后一条消息
          setTimeout(() => {
            finishConversation()
          }, 1000)
        }
      }

      setTypingMessageIndex(-1)
    },
    [totalRounds, messages, finishConversation],
  )

  // ===================== 录音按钮处理 =====================
  /** 按下开始录音 */
  const handlePointerDown = useCallback(async () => {
    // 对话已结束或正在上传，不允许录音
    if (status === 'completed' || status === 'ending' || isUploading) return
    // 正在打字，不允许录音
    if (typingMessageIndex >= 0) return

    await startRecording()
  }, [status, isUploading, typingMessageIndex, startRecording])

  /** 松手停止录音并发送 */
  const handlePointerUp = useCallback(async () => {
    if (!isRecording) return

    const blob = await stopRecording()
    // 用 ref 获取最新的 duration，避免闭包过期
    const finalDuration = durationRef.current
    if (blob) {
      await submitBlob(blob, finalDuration)
    }
  }, [isRecording, stopRecording, submitBlob])

  /** 录音按钮样式和状态 */
  const getRecorderButtonStyle = (): string => {
    if (isRecording) {
      return 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-recording-pulse'
    }
    if (isUploading) {
      return 'bg-gray-400 text-white cursor-not-allowed'
    }
    if (status === 'completed' || status === 'ending') {
      return 'bg-gray-200 text-gray-400 cursor-not-allowed'
    }
    if (typingMessageIndex >= 0) {
      return 'bg-gray-200 text-gray-400 cursor-not-allowed'
    }
    return 'bg-red-100 text-red-500 border-2 border-red-300 hover:bg-red-200 active:bg-red-500 active:text-white transition-colors'
  }

  /** 录音按钮文字 */
  const getRecorderLabel = (): string => {
    if (isRecording) return formatDuration(duration)
    if (isUploading) return '识别中...'
    if (status === 'completed' || status === 'ending') return '对话已结束'
    if (typingMessageIndex >= 0) return 'Alex 正在输入...'
    return '按住说话'
  }

  /** 录音区域副提示 */
  const getRecorderHint = (): string => {
    if (isRecording) return '松手发送语音'
    if (isUploading) return '正在识别你的语音...'
    if (status === 'completed') return ''
    if (typingMessageIndex >= 0) return '请等待 AI 回复完成后再说'
    return '长按按钮开始说话，松手发送'
  }

  // ===================== 再来一局 =====================
  const handleNewSession = useCallback(() => {
    setShowScoreModal(false)
    resetStore()
    resetRecorder()
    autoEndTriggeredRef.current = false
    userTurnCountRef.current = 0
    typingCompleteRef.current = new Set()
    navigate('/conversation')
  }, [resetStore, resetRecorder, navigate])

  // ===================== 手动结束对话 =====================
  const handleManualEnd = useCallback(() => {
    finishConversation()
  }, [finishConversation])

  // ===================== 重试发送（ASR 失败时） =====================
  const handleRetry = useCallback(() => {
    clearError()
    setShowToast(false)
  }, [clearError])

  // ===================== 渲染 =====================

  // 加载态骨架屏
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* 顶部骨架 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <Skeleton variant="text" width={120} height={14} />
            <Skeleton variant="text" width={80} height={10} className="mt-1" />
          </div>
          <Skeleton variant="text" width={60} height={12} />
        </div>
        {/* 对话区域骨架 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* AI 消息骨架 */}
          <div className="flex items-start gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
              <Skeleton variant="text" width={200} height={14} />
              <Skeleton variant="text" width={160} height={14} className="mt-2" />
            </div>
          </div>
          {/* 用户消息骨架 */}
          <div className="flex items-start gap-3 justify-end">
            <div className="bg-blue-100 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
              <Skeleton variant="text" width={150} height={14} />
            </div>
            <Skeleton variant="circular" width={32} height={32} />
          </div>
        </div>
        {/* 录音区域骨架 */}
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="flex items-center justify-center">
            <Skeleton variant="circular" width={64} height={64} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* ========== 顶部场景信息栏 ========== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/conversation')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="返回场景选择"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {sceneConfig?.emoji}{' '}
              {sceneConfig?.label ?? '情景对话'}
            </h2>
            <p className="text-xs text-gray-400">
              {difficultyLabel} &middot; {totalRounds} 轮对话
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              voiceEnabled
                ? 'bg-blue-50 text-blue-600'
                : 'bg-gray-100 text-gray-400'
            }`}
            title={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
          >
            {voiceEnabled ? '🔊 语音' : '🔇 静音'}
          </button>
          <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
            第 {Math.min(currentRound, totalRounds)}/{totalRounds} 轮
          </div>
        </div>
      </div>

      {/* ========== 对话消息区 ========== */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          const isAi = msg.role === 'ai'
          const isCurrentlyTyping = index === typingMessageIndex

          return (
            <div key={index}>
              {/* 轮次标签 */}
              {msg.round > 0 && (
                <div className="flex justify-center mb-2">
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    第 {msg.round}/{totalRounds} 轮
                  </span>
                </div>
              )}

              {/* 消息气泡 */}
              <div
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI 头像 */}
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    A
                  </div>
                )}

                {/* 气泡内容 */}
                <div
                  className={`
                    max-w-[75%] px-4 py-3 break-words
                    ${isUser
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                      : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md'
                    }
                  `}
                >
                  <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {isAi && isCurrentlyTyping ? (
                      <TypewriterText
                        text={msg.content}
                        speed={40}
                        onComplete={() => handleTypingComplete(index)}
                      />
                    ) : (
                      msg.content
                    )}
                  </p>
                </div>

                {/* 用户头像（首字母） */}
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    Me
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 第 4 轮提示 */}
        {currentRound === totalRounds - 1 && status === 'active' && (
          <div className="flex justify-center">
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-recording-pulse">
              还剩 1 轮对话
            </span>
          </div>
        )}

        {/* 对话结束提示 */}
        {status === 'ending' && (
          <div className="flex justify-center">
            <span className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              正在评估你的对话表现...
            </span>
          </div>
        )}

        {status === 'completed' && !showScoreModal && (
          <div className="flex justify-center">
            <span className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full">
              对话结束
            </span>
          </div>
        )}

        {/* ASR 失败重试提示 */}
        {error && error.includes('识别') && (
          <div className="flex justify-center">
            <span className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-full">
              {error}
              <button
                type="button"
                onClick={handleRetry}
                className="ml-2 underline font-medium hover:no-underline"
              >
                重试
              </button>
            </span>
          </div>
        )}

        {/* 网络错误重试 */}
        {status === 'error' && (
          <div className="flex flex-col items-center py-8">
            <p className="text-sm text-gray-500 mb-3">{error || '网络连接失败'}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              重新连接
            </button>
          </div>
        )}

        {/* 自动滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* ========== 底部录音区域 ========== */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shrink-0">
        {/* 录音错误提示 */}
        {recorderError && (
          <p className="text-xs text-center text-red-500 mb-2">{recorderError}</p>
        )}

        <div className="flex items-center justify-center mb-2">
          {/* 录音按钮 */}
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isUploading || status === 'completed' || status === 'ending' || typingMessageIndex >= 0}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              text-sm font-medium select-none
              touch-none
              ${getRecorderButtonStyle()}
            `}
            aria-label={getRecorderLabel()}
          >
            {isUploading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isRecording ? (
              <span className="text-white text-xs font-mono">{formatDuration(duration)}</span>
            ) : (
              <span className="text-xs">{getRecorderLabel()}</span>
            )}
          </button>
        </div>

        {/* 录音操作提示 */}
        {getRecorderHint() && (
          <p className="text-xs text-center text-gray-400">{getRecorderHint()}</p>
        )}

        {/* 手动结束对话按钮（V1.0 可选，显示在非最后一轮） */}
        {status === 'active' && currentRound < totalRounds && currentRound > 0 && (
          <button
            type="button"
            onClick={handleManualEnd}
            className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            结束当前对话
          </button>
        )}
      </div>

      {/* ========== 评分弹窗 ========== */}
      {scoreResult && (
        <ScoreModal
          scoreResult={scoreResult}
          visible={showScoreModal}
          onNewSession={handleNewSession}
          onClose={() => setShowScoreModal(false)}
        />
      )}

      {/* ========== 错误 Toast ========== */}
      <Toast
        type="error"
        message={error ?? ''}
        visible={showToast && !!error && !error.includes('识别')}
        onClose={() => {
          setShowToast(false)
          clearError()
        }}
      />
    </div>
  )
}

export default ConversationPage
