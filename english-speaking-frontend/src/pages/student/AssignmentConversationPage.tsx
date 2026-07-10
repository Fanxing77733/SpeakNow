/**
 * 作业对话练习页 — 学生完成 CONVERSATION 类型作业
 *
 * 路由: /student/assignment/:assignmentId/conversation
 * 流程: 加载作业配置 → 初始化对话 → 语音对话 → AI 评分 → 提交作业
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ScoreModal from '../../components/ScoreModal'
import Toast from '../../components/ui/Toast'
import Skeleton from '../../components/ui/Skeleton'
import { useConversationStore } from '../../stores/conversationStore'
import { useRecorder } from '../../hooks/useRecorder'
import { formatDuration } from '../../utils/format'
import { playAudioBlob } from '../../utils/audio'
import { synthesizeTTS } from '../../api/tts'
import { getStudentAssignmentDetail, submitAssignmentConversation } from '../../api/admin'
import { getScenes } from '../../api/roleplay'
import type { Scene, ConversationDifficulty, RoleplayScene } from '../../types/conversation'
import type { Assignment } from '../../api/admin'

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
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setDisplayedText(text)
        setIsComplete(true)
        onCompleteRef.current?.()
        return
      }
      setDisplayedText(text.slice(0, indexRef.current))
    }, speed)

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [text, speed, start])

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedText}
      {!isComplete && <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 align-text-bottom animate-recording-pulse" />}
    </span>
  )
}

// ======================== 难度映射 ========================

const DIFF_TO_CONV_DIFF: Record<string, ConversationDifficulty> = {
  EASY: 'beginner',
  MEDIUM: 'intermediate',
  HARD: 'advanced',
}

const AssignmentConversationPage = () => {
  const navigate = useNavigate()
  const { assignmentId } = useParams<{ assignmentId: string }>()

  // ===================== 加载状态 =====================
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [sceneInfo, setSceneInfo] = useState<RoleplayScene | null>(null)
  // ===================== Store 状态 =====================
  const {
    messages, currentRound, totalRounds, status,
    scoreResult, error,
    sendAudioMessage, finishConversation,
    initRoleplaySession, reset: resetStore, clearError,
  } = useConversationStore()

  // ===================== 录音 =====================
  const {
    isRecording, duration,
    startRecording, stopRecording,
    error: recorderError, reset: resetRecorder,
  } = useRecorder()

  // ===================== 本地状态 =====================
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1)
  const [isUploading, setIsUploading] = useState(false)
  const typingCompleteRef = useRef<Set<number>>(new Set())
  const userTurnCountRef = useRef(0)
  const autoEndTriggeredRef = useRef(false)
  const durationRef = useRef(0)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { durationRef.current = duration }, [duration])

  // ===================== Refs =====================
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ===================== 自动滚动 =====================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ===================== 加载作业配置 → 初始化对话 =====================
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoadingConfig(true)
      setConfigError(null)
      try {
        const [assgn, scenes] = await Promise.all([
          getStudentAssignmentDetail(Number(assignmentId)),
          getScenes(),
        ])
        if (cancelled) return

        if (assgn.assignmentType !== 'CONVERSATION') {
          setConfigError('此作业不是对话类型')
          return
        }

        setAssignment(assgn)

        // 查找对应的角色扮演场景
        let scene: RoleplayScene | undefined
        if (assgn.contentId) {
          scene = scenes.find((s) => s.id === assgn.contentId)
        }
        if (!scene && scenes.length > 0) {
          scene = scenes[0]
        }
        if (!scene) {
          setConfigError('未找到可用的对话场景')
          return
        }
        setSceneInfo(scene)

        const diff: ConversationDifficulty = DIFF_TO_CONV_DIFF[assgn.difficulty || 'MEDIUM'] || 'intermediate'

        // 初始化对话
        await initRoleplaySession(scene.sceneKey as Scene, diff, scene.id)
        if (!cancelled) {
          setLoadingConfig(false)
        }
      } catch (err: any) {
        if (!cancelled) {
          setConfigError(err?.message || '加载作业配置失败')
          setLoadingConfig(false)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [assignmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===================== 清理 =====================
  useEffect(() => {
    return () => { resetRecorder(); window.speechSynthesis?.cancel() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===================== 评分完成 → 显示弹窗 =====================
  useEffect(() => {
    if (status === 'completed' && scoreResult) {
      const timer = setTimeout(() => setShowScoreModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [status, scoreResult])

  // ===================== 错误 Toast =====================
  useEffect(() => {
    if (error) { setShowToast(true); setIsUploading(false); resetRecorder() }
  }, [error, resetRecorder])

  // ===================== 录音 → 发送 =====================
  const submitBlob = useCallback(async (blob: Blob, dur: number) => {
    setIsUploading(true)
    userTurnCountRef.current += 1
    await sendAudioMessage(blob, dur)
    setIsUploading(false)
    resetRecorder()
  }, [sendAudioMessage, resetRecorder])

  // ===================== 查找需打字的 AI 消息 =====================
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'ai' && !typingCompleteRef.current.has(i)) {
        setTypingMessageIndex(i); return
      }
    }
    setTypingMessageIndex(-1)
  }, [messages])

  // ===================== TTS 播报 =====================
  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return
    try {
      const blob = await synthesizeTTS(text)
      if (blob && blob.size > 0) { await playAudioBlob(blob); return }
    } catch { /* 降级 */ }
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'; utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  // ===================== 打字完成回调 =====================
  const handleTypingComplete = useCallback((messageIndex: number) => {
    typingCompleteRef.current.add(messageIndex)
    const msg = messages[messageIndex]
    if (msg && msg.role === 'ai') speakText(msg.content)

    if (userTurnCountRef.current >= totalRounds && !autoEndTriggeredRef.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'ai' && typingCompleteRef.current.has(messages.length - 1)) {
        autoEndTriggeredRef.current = true
        setTimeout(() => finishConversation(), 1000)
      }
    }
    setTypingMessageIndex(-1)
  }, [totalRounds, messages, finishConversation, speakText])

  // ===================== 录音交互 =====================
  const handlePointerDown = useCallback(async () => {
    if (status === 'completed' || status === 'ending' || isUploading) return
    if (typingMessageIndex >= 0) return
    await startRecording()
  }, [status, isUploading, typingMessageIndex, startRecording])

  const handlePointerUp = useCallback(async () => {
    if (!isRecording) return
    const blob = await stopRecording()
    if (blob) { await submitBlob(blob, durationRef.current) }
  }, [isRecording, stopRecording, submitBlob])

  // ===================== 提交作业 =====================
  const handleSubmit = useCallback(async () => {
    if (!assignment || submitted) return
    const store = useConversationStore.getState()
    if (!store.sessionId) return

    setSubmitting(true)
    try {
      await submitAssignmentConversation(assignment.id, store.sessionId)
      setSubmitted(true)
      setShowScoreModal(false)
      resetStore()
      navigate('/my-classes', { replace: true })
    } catch (err: any) {
      alert(err?.message || '提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }, [assignment, submitted, resetStore, navigate])

  // ===================== 再练一次（重置对话） =====================
  const handleNewSession = useCallback(async () => {
    if (!sceneInfo || !assignment) return
    setShowScoreModal(false)
    resetStore(); resetRecorder()
    autoEndTriggeredRef.current = false
    userTurnCountRef.current = 0
    typingCompleteRef.current = new Set()

    const diff: ConversationDifficulty = DIFF_TO_CONV_DIFF[assignment.difficulty || 'MEDIUM'] || 'intermediate'
    try {
      await initRoleplaySession(sceneInfo.sceneKey as Scene, diff, sceneInfo.id)
    } catch { /* ignore */ }
  }, [sceneInfo, assignment, resetStore, resetRecorder, initRoleplaySession])

  // ===================== 手动结束 =====================
  const handleManualEnd = useCallback(() => finishConversation(), [finishConversation])

  // ===================== 录音按钮样式 =====================
  const getRecorderStyle = () => {
    if (isRecording) return 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-recording-pulse'
    if (isUploading) return 'bg-gray-400 text-white cursor-not-allowed'
    if (status === 'completed' || status === 'ending') return 'bg-gray-200 text-gray-400 cursor-not-allowed'
    if (typingMessageIndex >= 0) return 'bg-gray-200 text-gray-400 cursor-not-allowed'
    return 'bg-red-100 text-red-500 border-2 border-red-300 hover:bg-red-200 active:bg-red-500 active:text-white transition-colors'
  }

  const getRecorderLabel = () => {
    if (isRecording) return formatDuration(duration)
    if (isUploading) return '识别中...'
    if (status === 'completed' || status === 'ending') return '对话已结束'
    if (typingMessageIndex >= 0) return 'AI 输入中...'
    return '按住说话'
  }

  const getRecorderHint = () => {
    if (isRecording) return '松手发送语音'
    if (isUploading) return '正在识别你的语音...'
    if (status === 'completed') return ''
    if (typingMessageIndex >= 0) return '请等待 AI 回复完成'
    return '长按按钮开始说话，松手发送'
  }

  // ===================== 渲染 =====================

  // 配置加载骨架屏
  if (loadingConfig) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Skeleton variant="text" width={120} height={14} />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton variant="circular" width={32} height={32} />
              <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
                <Skeleton variant="text" width={200} height={14} />
                <Skeleton variant="text" width={160} height={14} className="mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 配置加载错误
  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm mb-4">{configError}</p>
        <button onClick={() => navigate('/my-classes')}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
          返回作业列表
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* ========== 顶栏 ========== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/my-classes')}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {sceneInfo?.iconEmoji} {sceneInfo?.nameZh || '情景对话'}
            </h2>
            <p className="text-xs text-gray-400">
              {assignment?.title} &middot; {totalRounds} 轮对话
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${voiceEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            {voiceEnabled ? '语音' : '静音'}
          </button>
          <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
            第 {Math.min(currentRound, totalRounds)}/{totalRounds} 轮
          </div>
        </div>
      </div>

      {/* ========== 对话消息区 ========== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          const isAi = msg.role === 'ai'
          const isCurrentlyTyping = index === typingMessageIndex

          return (
            <div key={index}>
              {msg.round > 0 && (
                <div className="flex justify-center mb-2">
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    第 {msg.round}/{totalRounds} 轮
                  </span>
                </div>
              )}
              <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0">A</div>
                )}
                <div className={`max-w-[75%] px-4 py-3 break-words ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md' : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md'}`}>
                  <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {isAi && isCurrentlyTyping ? (
                      <TypewriterText text={msg.content} speed={40} onComplete={() => handleTypingComplete(index)} />
                    ) : msg.content}
                  </p>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0">Me</div>
                )}
              </div>
            </div>
          )
        })}

        {/* 最后 1 轮提示 */}
        {currentRound === totalRounds - 1 && status === 'active' && (
          <div className="flex justify-center">
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-recording-pulse">还剩 1 轮对话</span>
          </div>
        )}

        {status === 'ending' && (
          <div className="flex justify-center">
            <span className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">正在评估你的对话表现...</span>
          </div>
        )}

        {status === 'completed' && !showScoreModal && (
          <div className="flex justify-center">
            <span className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full">对话结束</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ========== 底部录音区域 ========== */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shrink-0">
        {recorderError && <p className="text-xs text-center text-red-500 mb-2">{recorderError}</p>}
        <div className="flex items-center justify-center mb-2">
          <button type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isUploading || status === 'completed' || status === 'ending' || typingMessageIndex >= 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-sm font-medium select-none touch-none ${getRecorderStyle()}`}>
            {isUploading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-xs">{getRecorderLabel()}</span>
            )}
          </button>
        </div>
        {getRecorderHint() && <p className="text-xs text-center text-gray-400">{getRecorderHint()}</p>}
        {status === 'active' && currentRound < totalRounds && currentRound > 0 && (
          <button type="button" onClick={handleManualEnd}
            className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
            结束当前对话
          </button>
        )}
      </div>

      {/* ========== 评分弹窗（含提交按钮） ========== */}
      {scoreResult && (
        <ScoreModal
          scoreResult={scoreResult}
          visible={showScoreModal}
          onNewSession={handleNewSession}
          onClose={() => setShowScoreModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* ========== 错误 Toast ========== */}
      <Toast type="error" message={error ?? ''}
        visible={showToast && !!error}
        onClose={() => { setShowToast(false); clearError() }} />
    </div>
  )
}

export default AssignmentConversationPage
