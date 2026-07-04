import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ScoreModal from '../../components/ScoreModal'
import Toast from '../../components/ui/Toast'
import Skeleton from '../../components/ui/Skeleton'
import { useConversationStore } from '../../stores/conversationStore'
import { useRecorder } from '../../hooks/useRecorder'
import { formatDuration } from '../../utils/format'
import { playAudioBlob } from '../../utils/audio'
import { synthesizeTTS } from '../../api/tts'
import { getScenes } from '../../api/roleplay'
import type { Scene, RoleplayScene } from '../../types/conversation'
import { request } from '../../api/client'

// ======================== 打字机效果 ========================

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
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setDisplayedText(text)
        setIsComplete(true)
        onCompleteRef.current?.()
        return
      }
      setDisplayedText(text.slice(0, indexRef.current))
    }, speed)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [text, speed, start])

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedText}
      {!isComplete && <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-text-bottom animate-recording-pulse" />}
    </span>
  )
}

// ======================== 角色扮演对话页 ========================

export default function RoleplayChatPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const routeState = location.state as {
    scene?: Scene
    roleplaySceneId?: number
    totalRounds?: number
    learningTaskId?: number
  } | undefined

  const sceneKey = routeState?.scene
  const roleplaySceneId = routeState?.roleplaySceneId
  const learningTaskId = routeState?.learningTaskId

  // 场景元数据
  const [sceneMeta, setSceneMeta] = useState<RoleplayScene | null>(null)

  useEffect(() => {
    if (roleplaySceneId) {
      getScenes().then(scenes => {
        const found = scenes.find(s => s.id === roleplaySceneId)
        if (found) setSceneMeta(found)
      }).catch(() => {})
    }
  }, [roleplaySceneId])

  const store = useConversationStore()

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
  } = store

  const effectiveTotalRounds = sceneMeta?.totalRounds ?? totalRounds

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error: recorderError,
    reset: resetRecorder,
  } = useRecorder()

  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1)
  const [isUploading, setIsUploading] = useState(false)
  const [showObjective, setShowObjective] = useState(true)
  const typingCompleteRef = useRef<Set<number>>(new Set())
  const userTurnCountRef = useRef(0)
  const autoEndTriggeredRef = useRef(false)
  const durationRef = useRef(0)
  const taskCompletedRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { durationRef.current = duration }, [duration])

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 清理
  useEffect(() => {
    return () => {
      resetRecorder()
      window.speechSynthesis?.cancel()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 评分完成
  useEffect(() => {
    if (status === 'completed' && scoreResult) {
      if (learningTaskId && !taskCompletedRef.current) {
        taskCompletedRef.current = true
        request<unknown>({ method: 'POST', url: `/path/task/${learningTaskId}/complete` }).catch(() => {})
      }
      const timer = setTimeout(() => setShowScoreModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [status, scoreResult, learningTaskId])

  // 错误 Toast
  useEffect(() => {
    if (error) {
      setShowToast(true)
      setIsUploading(false)
      resetRecorder()
    }
  }, [error, resetRecorder])

  const submitBlob = useCallback(async (blob: Blob, dur: number) => {
    setIsUploading(true)
    userTurnCountRef.current += 1
    await sendAudioMessage(blob, dur)
    setIsUploading(false)
    resetRecorder()
  }, [sendAudioMessage, resetRecorder])

  // 打字追踪
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'ai' && !typingCompleteRef.current.has(i)) {
        setTypingMessageIndex(i)
        return
      }
    }
    setTypingMessageIndex(-1)
  }, [messages])

  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return
    try {
      const blob = await synthesizeTTS(text)
      if (blob && blob.size > 0) { await playAudioBlob(blob); return }
    } catch {}
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

  const handleTypingComplete = useCallback((messageIndex: number) => {
    typingCompleteRef.current.add(messageIndex)
    const msg = messages[messageIndex]
    if (msg && msg.role === 'ai') speakText(msg.content)

    if (
      userTurnCountRef.current >= effectiveTotalRounds &&
      !autoEndTriggeredRef.current
    ) {
      const lastMsg = messages[messages.length - 1]
      const lastIndex = messages.length - 1
      if (lastMsg?.role === 'ai' && typingCompleteRef.current.has(lastIndex)) {
        autoEndTriggeredRef.current = true
        setTimeout(() => finishConversation(), 1000)
      }
    }
    setTypingMessageIndex(-1)
  }, [effectiveTotalRounds, messages, finishConversation, speakText])

  const handlePointerDown = useCallback(async () => {
    if (status === 'completed' || status === 'ending' || isUploading) return
    if (typingMessageIndex >= 0) return
    await startRecording()
  }, [status, isUploading, typingMessageIndex, startRecording])

  const handlePointerUp = useCallback(async () => {
    if (!isRecording) return
    const blob = await stopRecording()
    const finalDuration = durationRef.current
    if (blob) await submitBlob(blob, finalDuration)
  }, [isRecording, stopRecording, submitBlob])

  const handleNewSession = useCallback(() => {
    setShowScoreModal(false)
    resetStore()
    resetRecorder()
    autoEndTriggeredRef.current = false
    userTurnCountRef.current = 0
    typingCompleteRef.current = new Set()
    navigate('/roleplay')
  }, [resetStore, resetRecorder, navigate])

  const handleManualEnd = useCallback(() => finishConversation(), [finishConversation])

  // 加载态
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        <div className="bg-white border-b border-teal-100 px-4 py-3">
          <Skeleton variant="text" width={160} height={16} />
          <Skeleton variant="text" width={100} height={12} className="mt-1" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
              <Skeleton variant="text" width={220} height={14} />
              <Skeleton variant="text" width={160} height={14} className="mt-2" />
            </div>
          </div>
        </div>
        <div className="bg-white border-t border-teal-100 px-4 py-4 flex justify-center">
          <Skeleton variant="circular" width={64} height={64} />
        </div>
      </div>
    )
  }

  const progressPercent = Math.round((Math.min(currentRound, effectiveTotalRounds) / effectiveTotalRounds) * 100)

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* 顶部角色信息栏 */}
      <div className="bg-white border-b border-teal-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => navigate('/roleplay')}
            className="text-teal-400 hover:text-teal-600 transition-colors"
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-teal-800">
              {sceneMeta?.iconEmoji} {sceneMeta?.nameZh ?? sceneKey ?? '角色扮演'}
            </h2>
            {sceneMeta && (
              <p className="text-xs text-teal-500/70 mt-0.5">
                🎯 你扮演 <span className="font-medium text-teal-700">{sceneMeta.userRoleZh}</span>
                {' · '}
                🤖 AI: <span className="font-medium text-teal-700">{sceneMeta.aiRoleZh}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                voiceEnabled ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
            <span className="text-xs text-teal-400 bg-teal-50 px-2 py-1 rounded-full">
              第 {Math.min(currentRound, effectiveTotalRounds)}/{effectiveTotalRounds} 轮
            </span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-1.5 bg-teal-100/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 目标提示（可折叠） */}
        {sceneMeta && showObjective && (
          <div className="mt-2 bg-teal-50/50 rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-xs shrink-0 mt-0.5">🎯</span>
            <p className="text-xs text-teal-600 leading-relaxed flex-1">{sceneMeta.objectiveZh}</p>
            <button
              type="button"
              onClick={() => setShowObjective(false)}
              className="text-teal-400 hover:text-teal-600 text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          const isAi = msg.role === 'ai'
          const isCurrentlyTyping = index === typingMessageIndex

          return (
            <div key={index}>
              {msg.round > 0 && (
                <div className="flex justify-center mb-2">
                  <span className="text-xs text-teal-400/60 bg-teal-50/50 px-2 py-0.5 rounded-full">
                    第 {msg.round}/{effectiveTotalRounds} 轮
                  </span>
                </div>
              )}

              <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {sceneMeta?.aiRoleZh?.charAt(0) ?? 'A'}
                  </div>
                )}

                <div className={`max-w-[75%] px-4 py-3 break-words ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-2xl rounded-tr-md'
                    : 'bg-teal-50 text-teal-800 rounded-2xl rounded-tl-md'
                }`}>
                  <p className="text-sm leading-relaxed">
                    {isAi && isCurrentlyTyping ? (
                      <TypewriterText text={msg.content} speed={40} onComplete={() => handleTypingComplete(index)} />
                    ) : (
                      msg.content
                    )}
                  </p>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {sceneMeta?.userRoleZh?.charAt(0) ?? 'Me'}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 最后一轮提示 */}
        {currentRound === effectiveTotalRounds - 1 && status === 'active' && (
          <div className="flex justify-center">
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              还剩 1 轮对话
            </span>
          </div>
        )}

        {status === 'ending' && (
          <div className="flex justify-center">
            <span className="text-sm text-teal-500 bg-teal-50 px-4 py-2 rounded-full">正在评估你的对话表现...</span>
          </div>
        )}

        {status === 'completed' && !showScoreModal && (
          <div className="flex justify-center">
            <span className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">对话结束</span>
          </div>
        )}

        {error && error.includes('识别') && (
          <div className="flex justify-center">
            <span className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-full">
              {error}
              <button type="button" onClick={() => { clearError(); setShowToast(false) }} className="ml-2 underline font-medium hover:no-underline">重试</button>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 录音区域 */}
      <div className="bg-white border-t border-teal-100 px-4 py-4 shrink-0">
        {recorderError && <p className="text-xs text-center text-red-500 mb-2">{recorderError}</p>}

        <div className="flex items-center justify-center mb-2">
          <div className="text-center">
            {isRecording ? (
              <span className="text-red-500 font-medium animate-pulse text-sm">
                录音中 {formatDuration(duration)}
              </span>
            ) : isUploading ? (
              <span className="text-teal-400 text-sm">识别中...</span>
            ) : (
              <span className="text-teal-400 text-sm">
                {status === 'completed' ? '' : typingMessageIndex >= 0 ? 'AI 正在回复...' : '按住按钮开始说话'}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={isRecording ? handlePointerUp : undefined}
            onTouchStart={e => { e.preventDefault(); handlePointerDown() }}
            onTouchEnd={e => { e.preventDefault(); handlePointerUp() }}
            disabled={isUploading || status === 'completed' || status === 'ending' || typingMessageIndex >= 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 scale-110 shadow-lg shadow-red-200'
                : isUploading || status === 'completed' || status === 'ending' || typingMessageIndex >= 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-md'
            }`}
            aria-label={isRecording ? '松手发送' : '按住说话'}
          >
            {isUploading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-xs text-center text-teal-400/60 mt-2">
          {isRecording ? '松手发送语音' : isUploading ? '正在识别你的语音...' : '长按按钮开始说话，松手发送'}
        </p>

        {status === 'active' && currentRound < effectiveTotalRounds && currentRound > 0 && (
          <button type="button" onClick={handleManualEnd}
            className="mt-2 w-full text-xs text-teal-400/60 hover:text-teal-600 transition-colors">
            结束当前对话
          </button>
        )}
      </div>

      {/* 评分弹窗 */}
      {scoreResult && (
        <ScoreModal
          scoreResult={scoreResult}
          visible={showScoreModal}
          onNewSession={handleNewSession}
          onClose={() => setShowScoreModal(false)}
          learningTaskId={learningTaskId}
        />
      )}

      <Toast type="error" message={error ?? ''} visible={showToast && !!error && !error.includes('识别')}
        onClose={() => { setShowToast(false); clearError() }} />
    </div>
  )
}
