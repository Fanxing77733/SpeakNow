/**
 * 发音评测页 — 核心页面
 *
 * 交互流程：
 * 1. 选择难度 → 加载跟读句子列表
 * 2. 点击句子卡片选中 → 展示大号参考文本
 * 3. 长按录音按钮（Push-to-Talk）→ 红色呼吸灯动画
 * 4. 松手 → 自动上传录音 → 跳转评测结果页
 *
 * 状态机：idle → recording → uploading | error → idle
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRecorder } from '../../hooks/useRecorder'
import { getContentList, evaluatePronunciation } from '../../api/practice'
import type { ContentSentence, Difficulty, PracticeStatus } from '../../types/practice'
import { formatDuration } from '../../utils/format'

/** 难度筛选选项 */
interface DifficultyOption {
  label: string
  value: Difficulty | undefined
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { label: '全部', value: undefined },
  { label: '初级', value: 'beginner' },
  { label: '中级', value: 'intermediate' },
  { label: '高级', value: 'advanced' },
]

/** 难度标签对应的展示文案 */
const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

/** 获取难度对应的颜色主题 */
function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'intermediate':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'advanced':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

/** 使用 Web Speech API 朗读英文文本作为示范 */
function playDemo(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}

/** 提取 axios 错误的友好消息 */
function extractErrorMsg(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'Network Error') return '网络连接失败，请检查网络'
    // 后端返回的友好文案直接使用
    if (!/(error|exception|timeout|500|503|502)/i.test(error.message)) {
      return error.message
    }
  }
  return '评测服务繁忙，请稍后重试'
}

/** 句子卡片骨架屏 */
function SentenceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded" />
    </div>
  )
}

const PracticePage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // 从结果页 "再练一次" 带回的句子 ID，用于自动选中
  const reselectId = (location.state as { reselectId?: number } | null)?.reselectId
  // 标记是否已消费 reselectId
  const reselectConsumedRef = useRef(false)

  // ========== 内容列表状态 ==========
  const [sentences, setSentences] = useState<ContentSentence[]>([])
  const [loadingSentences, setLoadingSentences] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined)

  // ========== 选中句子 ==========
  const [selectedSentence, setSelectedSentence] = useState<ContentSentence | null>(null)

  // ========== 练习状态机 ==========
  const [status, setStatus] = useState<PracticeStatus>('idle')
  const [practiceError, setPracticeError] = useState<string | null>(null)

  // ========== 录音 Hook ==========
  const {
    duration,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    reset: resetRecorder,
  } = useRecorder()

  // 用 ref 持有最新的 audioBlob/duration，避免闭包陈旧问题
  const audioBlobRef = useRef<Blob | null>(null)
  const durationRef = useRef<number>(0)
  useEffect(() => {
    audioBlobRef.current = audioBlob
  }, [audioBlob])
  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  // ========== 加载句子列表 ==========
  useEffect(() => {
    let cancelled = false
    setLoadingSentences(true)
    setLoadError(null)
    setSelectedSentence(null)

    getContentList(difficulty)
      .then((data) => {
        if (!cancelled) setSentences(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(extractErrorMsg(err))
      })
      .finally(() => {
        if (!cancelled) setLoadingSentences(false)
      })

    return () => {
      cancelled = true
    }
  }, [difficulty])

  // ========== 自动选中 "再练一次" 带回的句子 ==========
  useEffect(() => {
    if (!reselectId || reselectConsumedRef.current || loadingSentences) return
    const target = sentences.find((s) => s.id === reselectId)
    if (target) {
      setSelectedSentence(target)
      reselectConsumedRef.current = true
      // 清除 location state 避免反复触发
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [reselectId, sentences, loadingSentences, location.pathname, navigate])

  // ========== 监听录音器错误 ==========
  useEffect(() => {
    if (recorderError) {
      setPracticeError(recorderError)
      setStatus('error')
    }
  }, [recorderError])

  // ========== 提交录音 ==========
  const submitBlob = useCallback(
    async (blob: Blob) => {
      if (!selectedSentence) return

      // 文件大小校验：≤5MB
      if (blob.size > 5 * 1024 * 1024) {
        setPracticeError('录音文件过大，请缩短录音时间后重试')
        setStatus('error')
        return
      }

      setStatus('uploading')
      setPracticeError(null)

      try {
        const result = await evaluatePronunciation(blob, selectedSentence.id, durationRef.current)
        // 跳转结果页，携带评测结果和句子信息
        navigate('/practice/result', {
          state: { result, sentence: selectedSentence },
        })
      } catch (err: unknown) {
        setPracticeError(extractErrorMsg(err))
        setStatus('error')
      }
    },
    [selectedSentence, navigate],
  )

  // ========== 录音交互 ==========
  const handlePointerDown = useCallback(async () => {
    if (!selectedSentence || status === 'uploading') return
    setPracticeError(null)
    setStatus('recording')
    await startRecording()
  }, [selectedSentence, status, startRecording])

  const handlePointerUp = useCallback(async () => {
    if (status !== 'recording') return

    const blob = await stopRecording()
    if (blob) {
      await submitBlob(blob)
      return
    }

    // stopRecording 返回 null 但 audioBlob 已有值（auto-stop at 60s 场景）
    const autoBlob = audioBlobRef.current
    if (autoBlob) {
      await submitBlob(autoBlob)
    }
    // blob 仍为 null 说明校验未通过（<0.5s），error 已由 hook 设置
  }, [status, stopRecording, submitBlob])

  // ========== 重新加载 ==========
  const handleRetryLoad = useCallback(() => {
    setLoadError(null)
    setLoadingSentences(true)
    getContentList(difficulty)
      .then(setSentences)
      .catch((err: unknown) => setLoadError(extractErrorMsg(err)))
      .finally(() => setLoadingSentences(false))
  }, [difficulty])

  // ========== 重试录音 ==========
  const handleRetry = useCallback(() => {
    resetRecorder()
    setPracticeError(null)
    setStatus('idle')
  }, [resetRecorder])

  // ========== 渲染：内容加载错误 ==========
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm mb-4">{loadError}</p>
        <button
          onClick={handleRetryLoad}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ========== 顶部标题 ========== */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">发音评测</h1>
      <p className="text-sm text-gray-500 mb-6">
        选择跟读内容，朗读后 AI 将为你的发音评分
      </p>

      {/* ========== 难度筛选标签 ========== */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {DIFFICULTY_OPTIONS.map((opt) => {
          const isActive = difficulty === opt.value
          return (
            <button
              key={opt.label}
              onClick={() => setDifficulty(opt.value)}
              disabled={status === 'uploading'}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${status === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* ========== 句子卡片网格 ========== */}
      {loadingSentences ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SentenceCardSkeleton key={i} />
          ))}
        </div>
      ) : sentences.length === 0 ? (
        /* 空状态 */
        <div className="flex flex-col items-center justify-center py-12 mb-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-1">暂无该难度的跟读内容</p>
          <p className="text-gray-400 text-xs">请切换到其他难度试试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {sentences.map((s) => {
            const isSelected = selectedSentence?.id === s.id
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (status === 'uploading') return
                  setSelectedSentence(s)
                  setPracticeError(null)
                  if (status === 'error') setStatus('idle')
                }}
                disabled={status === 'uploading'}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                  ${status === 'uploading' ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                <p className="text-sm text-gray-800 leading-relaxed">{s.sentence}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(s.difficulty)}`}>
                  {DIFFICULTY_LABEL[s.difficulty] || s.difficulty}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ========== 选中句子展示区 ========== */}
      {selectedSentence && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">参考文本</p>
              <p className="text-lg md:text-xl font-medium text-gray-900 leading-relaxed">
                {selectedSentence.sentence}
              </p>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(selectedSentence.difficulty)}`}>
                {DIFFICULTY_LABEL[selectedSentence.difficulty] || selectedSentence.difficulty}
                {selectedSentence.category ? ` ・ ${selectedSentence.category}` : ''}
              </span>
            </div>
            <button
              onClick={() => playDemo(selectedSentence.sentence)}
              disabled={status === 'recording' || status === 'uploading'}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="播放示范音"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l5.4-3.9c.5-.3 1.1-.1 1.4.4.1.2.2.4.2.7v12c0 .6-.4 1-1 1-.3 0-.6-.1-.8-.3l-5.2-3.9H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.5z" />
              </svg>
              <span className="hidden sm:inline">播放示范音</span>
            </button>
          </div>
        </div>
      )}

      {/* ========== 录音区域 ========== */}
      <div className="flex flex-col items-center gap-4 py-4">
        {/* 录音按钮 — 根据状态切换样式 */}
        {status === 'idle' || status === 'recording' ? (
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!selectedSentence}
            className={`
              w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center
              select-none touch-none transition-all duration-200
              outline-none focus-visible:ring-4 focus-visible:ring-red-300
              ${!selectedSentence
                ? 'bg-gray-100 border-4 border-gray-200 cursor-not-allowed'
                : status === 'recording'
                  ? 'bg-red-500 border-4 border-red-600 shadow-lg shadow-red-200 animate-recording-pulse cursor-pointer active:scale-95'
                  : 'bg-white border-4 border-red-400 hover:border-red-500 hover:shadow-md hover:shadow-red-100 cursor-pointer active:scale-95'
              }
            `}
            aria-label={status === 'recording' ? '松手结束录音' : '长按开始录音'}
          >
            {/* 麦克风图标 */}
            <svg
              className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${status === 'recording' ? 'text-white' : 'text-red-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>
        ) : status === 'uploading' ? (
          /* 上传中：灰色按钮 + 旋转加载 */
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : status === 'error' ? (
          /* 错误状态：可重试 */
          <button
            onClick={handleRetry}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-4 border-red-400 hover:border-red-500 flex items-center justify-center cursor-pointer transition-colors hover:shadow-md"
            aria-label="重试录音"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>
        ) : null}

        {/* 状态提示文字 */}
        {status === 'idle' && selectedSentence && (
          <p className="text-sm text-gray-500">
            长按按钮开始录音，松手结束
          </p>
        )}
        {status === 'idle' && !selectedSentence && (
          <p className="text-sm text-gray-400">
            请先选择上方跟读内容
          </p>
        )}
        {status === 'recording' && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-mono text-red-500 font-medium tabular-nums">
              {formatDuration(duration)}
            </span>
            <span className="text-xs text-red-400">松手结束录音</span>
          </div>
        )}
        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-gray-500 font-medium">正在评测...</span>
            <span className="text-xs text-gray-400">请稍候</span>
          </div>
        )}
        {status === 'error' && practiceError && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-red-600">{practiceError}</p>
            <button
              onClick={handleRetry}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              点击重试
            </button>
          </div>
        )}
      </div>

      {/* ========== 录音说明 ========== */}
      {!selectedSentence && !loadingSentences && (
        <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">使用说明</h3>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">1</span>
              <span>在上方句子列表中，点击选择你要跟读的内容</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">2</span>
              <span>点击"播放示范音"按钮，先听一遍标准发音</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">3</span>
              <span>长按红色录音按钮，朗读参考文本，松手结束</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">4</span>
              <span>AI 将分析你的发音，给出各维度评分和逐词纠错建议</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default PracticePage
