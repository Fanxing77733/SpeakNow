/**
 * 水平测评页 — V1.0 固定20题测评
 *
 * 核心交互流程：
 * 1. 进入页面 → 调用 GET /api/v1/assessment/questions?type=fixed 获取20题
 * 2. 逐题展示（一次显示一题），顶部进度条 + 题型标签 + 60s倒计时
 * 3. 点击选项 → 0.2s 过渡动画 → 自动进入下一题
 * 4. 60s 超时 → 自动跳过计0分 → 下一题
 * 5. 20题全部完成 → 调用 POST /api/v1/assessment/submit → 跳转结果页
 * 6. 中途刷新页面 → beforeunload 提示"测评进度不会保存"
 *
 * 安全要求：
 * - 前端不缓存、不展示 correct_answer
 * - optionsJson 在前端 JSON.parse 后渲染选项
 * - 倒计时纯前端实现，不依赖后端
 * - 答题进度仅存组件 state，不持久化
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { QuestionVO, Option, AnswerItem } from '../../types/assessment'
import { QUESTION_TYPE_LABELS } from '../../types/assessment'
import { getQuestions, submitAnswers } from '../../api/assessment'
import Skeleton from '../../components/ui/Skeleton'

/** 每题限时（秒） */
const TIME_PER_QUESTION = 60
/** 选项点击后过渡时间（ms） */
const TRANSITION_MS = 200
/** 总题数 */
const TOTAL_QUESTIONS = 20

/** 解析题目选项 JSON 字符串为 Option 数组 */
function parseOptions(optionsJson: string): Option[] {
  try {
    const parsed = JSON.parse(optionsJson)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

/** 解析听力题的 questionText，分离指令和 transcript */
function parseListeningQuestion(questionText: string): {
  instruction: string
  transcript: string | null
} {
  const marker = '[Audio transcript:'
  const idx = questionText.indexOf(marker)
  if (idx === -1) {
    return { instruction: questionText, transcript: null }
  }
  const instruction = questionText.substring(0, idx).trim()
  const afterMarker = questionText.substring(idx + marker.length)
  const firstQuote = afterMarker.indexOf('"')
  const lastQuote = afterMarker.lastIndexOf('"')
  let transcript: string | null = null
  if (firstQuote !== -1 && lastQuote > firstQuote) {
    transcript = afterMarker.substring(firstQuote + 1, lastQuote)
  }
  return { instruction, transcript }
}

/** 使用 Web Speech API 朗读英文文本 */
function speakTranscript(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

/** 骨架屏：测评页面加载中 */
function AssessmentSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 进度条骨架 */}
      <div className="mb-8">
        <Skeleton variant="text" width="100%" height={8} className="rounded-full" />
        <div className="flex justify-between mt-2">
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={40} height={14} />
        </div>
      </div>
      {/* 题目骨架 */}
      <Skeleton variant="text" width="50%" height={24} className="mb-6" />
      <Skeleton variant="text" width="90%" height={18} className="mb-2" />
      <Skeleton variant="text" width="75%" height={18} className="mb-8" />
      {/* 选项骨架 */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={56} />
        ))}
      </div>
    </div>
  )
}

const AssessmentPage = () => {
  const navigate = useNavigate()

  // ===== 状态 =====
  const [questions, setQuestions] = useState<QuestionVO[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerItem[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)

  // ===== Refs（用于回调闭包中读取最新值）=====
  const isTransitioningRef = useRef(false)
  const currentIndexRef = useRef(0)
  const questionsRef = useRef<QuestionVO[]>([])
  const answersRef = useRef<AnswerItem[]>([])
  const submittingRef = useRef(false)

  // 同步 ref
  useEffect(() => { isTransitioningRef.current = isTransitioning }, [isTransitioning])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { submittingRef.current = submitting }, [submitting])

  // ===== 听力题自动播放 =====
  const speechAvailable = 'speechSynthesis' in window
  const hasAutoPlayedRef = useRef(false)

  // 切题时重置自动播放标记
  useEffect(() => {
    hasAutoPlayedRef.current = false
  }, [currentIndex])

  // 进入听力题时自动朗读 transcript（延迟 300ms 等过渡动画结束）
  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (currentIndex >= questions.length) return
    const q = questions[currentIndex]
    if (q.type !== 'listening') return

    const { transcript } = parseListeningQuestion(q.questionText)
    if (!transcript) return
    if (hasAutoPlayedRef.current) return

    hasAutoPlayedRef.current = true
    const timer = setTimeout(() => {
      speakTranscript(transcript)
    }, 300)
    return () => clearTimeout(timer)
  }, [currentIndex, loading, submitting, questions])

  // 卸载时取消所有语音
  useEffect(() => {
    return () => {
      if (speechAvailable) {
        window.speechSynthesis.cancel()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== 获取题目 =====
  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getQuestions('fixed')
      if (!data || data.length === 0) {
        setError('题库维护中，请稍后再试')
        setLoading(false)
        return
      }
      setQuestions(data)
      setLoading(false)
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 503) {
        setError('题库维护中，请稍后再试')
      } else {
        setError('加载题目失败，请检查网络后重试')
      }
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
    return () => {
      // 清理：防止卸载后 setState
    }
  }, [fetchQuestions])

  // ===== 倒计时 =====
  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (currentIndex >= questions.length) return

    // 重置倒计时
    setTimeLeft(TIME_PER_QUESTION)
    setSelectedOption(null)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // 使用 setTimeout 将 handleTimeout 移出 setState 回调
          setTimeout(() => {
            if (!isTransitioningRef.current && !submittingRef.current) {
              handleTimeout()
            }
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loading, submitting, questions.length])

  // ===== 中途退出提示 =====
  useEffect(() => {
    // 测评进行中才拦截
    if (loading || submitting || questions.length === 0) return
    if (currentIndex >= questions.length) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Chrome 需要设置 returnValue
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [loading, submitting, questions.length, currentIndex])

  // ===== 处理超时 =====
  const handleTimeout = useCallback(() => {
    if (isTransitioningRef.current || submittingRef.current) return

    const idx = currentIndexRef.current
    const qs = questionsRef.current
    if (idx >= qs.length) return

    isTransitioningRef.current = true
    setIsTransitioning(true)

    const questionId = qs[idx].id
    const newAnswer: AnswerItem = { questionId, selectedKey: '' }
    const prevAnswers = answersRef.current
    const newAnswers = [...prevAnswers, newAnswer]
    setAnswers(newAnswers)

    // 200ms 过渡后进入下一题或提交
    setTimeout(() => {
      advanceOrSubmit(idx, qs, newAnswers)
    }, TRANSITION_MS)
  }, [])

  // ===== 点击选项 =====
  const handleSelectOption = useCallback(
    (key: string) => {
      if (isTransitioningRef.current || submittingRef.current) return

      const idx = currentIndexRef.current
      const qs = questionsRef.current
      if (idx >= qs.length) return

      isTransitioningRef.current = true
      setIsTransitioning(true)
      setSelectedOption(key)

      const questionId = qs[idx].id
      const newAnswer: AnswerItem = { questionId, selectedKey: key }
      const prevAnswers = answersRef.current
      const newAnswers = [...prevAnswers, newAnswer]
      setAnswers(newAnswers)

      // 200ms 过渡后进入下一题或提交
      setTimeout(() => {
        advanceOrSubmit(idx, qs, newAnswers)
      }, TRANSITION_MS)
    },
    [],
  )

  // ===== 前进到下一题或提交 =====
  const advanceOrSubmit = useCallback(
    (idx: number, qs: QuestionVO[], allAnswers: AnswerItem[]) => {
      if (idx < qs.length - 1) {
        // 还有下一题
        setCurrentIndex(idx + 1)
        setIsTransitioning(false)
        isTransitioningRef.current = false
      } else {
        // 全部完成，提交
        submitAll(allAnswers)
      }
    },
    [],
  )

  // ===== 提交全部答案 =====
  const submitAll = useCallback(
    async (allAnswers: AnswerItem[]) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)

      try {
        const result = await submitAnswers(allAnswers)
        // 跳转结果页，通过路由 state 传递结果
        navigate('/assessment/result', { state: { result } })
      } catch (e: unknown) {
        submittingRef.current = false
        setSubmitting(false)
        setIsTransitioning(false)
        isTransitioningRef.current = false

        if (axios.isAxiosError(e)) {
          const serverMsg = (e.response?.data as { message?: string })?.message
          if (serverMsg) {
            setError(serverMsg)
          } else {
            switch (e.response?.status) {
              case 400:
                setError('答案数据有误，请重新开始测评')
                break
              case 401:
                setError('登录已过期，请重新登录')
                break
              case 503:
                setError('评分服务繁忙，请稍后重试')
                break
              default:
                setError('提交失败，请检查网络后重试')
            }
          }
        } else {
          setError('提交失败，请检查网络后重试')
        }
      }
    },
    [navigate],
  )

  // ===== 渲染：加载中 =====
  if (loading) {
    return <AssessmentSkeleton />
  }

  // ===== 渲染：加载失败 / 题库不足 =====
  if (error && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4 opacity-30">&#x1F4DA;</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          暂时无法开始测评
        </h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          type="button"
          onClick={fetchQuestions}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg
                     hover:bg-blue-700 active:scale-95 transition-all"
        >
          重新加载
        </button>
      </div>
    )
  }

  // ===== 渲染：提交中 =====
  if (submitting && questions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          正在评估你的英语水平...
        </h2>
        <p className="text-sm text-gray-500">请稍候，结果马上出来</p>
      </div>
    )
  }

  // ===== 渲染：提交失败（all questions answered but submit failed）=====
  if (error && questions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4 opacity-30">&#x26A0;</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">提交测评时出现问题</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null)
            submitAll(answersRef.current)
          }}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg
                     hover:bg-blue-700 active:scale-95 transition-all"
        >
          重试提交
        </button>
      </div>
    )
  }

  // ===== 安全检查：题目数据异常 =====
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500">题库维护中，请稍后再试</p>
      </div>
    )
  }

  // ===== 安全检查：索引越界 =====
  if (currentIndex >= questions.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500">题目加载异常，请重新开始</p>
      </div>
    )
  }

  // ===== 正式渲染：测评中 =====
  const currentQuestion = questions[currentIndex]
  const options = parseOptions(currentQuestion.optionsJson)
  const progressPercent = ((currentIndex + 1) / questions.length) * 100
  const questionTypeLabel = QUESTION_TYPE_LABELS[currentQuestion.type]
  const isLastTen = timeLeft <= 10 && timeLeft > 0
  const progress = currentIndex + 1
  const isListening = currentQuestion.type === 'listening'

  // 听力题：解析出指令文本和 transcript
  const { instruction: listeningInstruction, transcript } = isListening
    ? parseListeningQuestion(currentQuestion.questionText)
    : { instruction: '', transcript: null }
  const displayText = isListening ? listeningInstruction : currentQuestion.questionText

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ===== 顶部信息栏 ===== */}
      <div className="mb-6">
        {/* 进度条 */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 进度信息行 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* 题型标签 */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {questionTypeLabel}
            </span>
            {/* 进度文字 */}
            <span className="text-sm text-gray-500">
              {progress}/{TOTAL_QUESTIONS}
            </span>
          </div>

          {/* 倒计时 */}
          <div
            className={`flex items-center gap-1 font-mono text-lg font-bold tabular-nums
              ${isLastTen
                ? 'text-red-500 animate-countdown-pulse'
                : 'text-gray-700'
              }`}
          >
            <svg
              className={`w-4 h-4 ${isLastTen ? 'text-red-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{timeLeft}</span>
            <span className="text-xs font-normal text-gray-400 ml-0.5">秒</span>
          </div>
        </div>
      </div>

      {/* ===== 题目区域 ===== */}
      <div
        className={`transition-opacity duration-200 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* 听力题：音频播放区域 + 降级文案 */}
        {isListening && (
          <div className="mb-4">
            {speechAvailable && transcript ? (
              <button
                type="button"
                onClick={() => speakTranscript(transcript)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200
                           text-blue-700 text-sm font-medium hover:bg-blue-100 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l5.4-3.9c.5-.3 1.1-.1 1.4.4.1.2.2.4.2.7v12c0 .6-.4 1-1 1-.3 0-.6-.1-.8-.3l-5.2-3.9H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.5z" />
                </svg>
                播放音频
              </button>
            ) : transcript ? (
              /* 降级：speechSynthesis 不可用时显示 transcript 原文 */
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-500 mb-1">请阅读以下内容后作答：</p>
                <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* 题目文本 */}
        <h2 className="text-lg font-semibold text-gray-900 leading-relaxed mb-8">
          {displayText}
        </h2>

        {/* 选项列表 */}
        <div className="space-y-3">
          {options.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              题目选项加载异常，请刷新重试
            </p>
          ) : (
            options.map((option) => {
              const isSelected = selectedOption === option.key
              const baseStyle =
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer'

              const defaultStyle =
                'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]'
              const selectedStyle = `border-blue-500 bg-blue-50 ${isTransitioning ? 'scale-[0.98]' : ''}`

              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={isTransitioning}
                  onClick={() => handleSelectOption(option.key)}
                  className={`${baseStyle} ${isSelected ? selectedStyle : defaultStyle}`}
                  aria-label={`选项 ${option.key}: ${option.text}`}
                >
                  {/* 选项字母标号 */}
                  <span
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                      ${isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {option.key}
                  </span>
                  {/* 选项文本 */}
                  <span
                    className={`text-sm leading-relaxed flex-1 ${
                      isSelected ? 'text-blue-700 font-medium' : 'text-gray-800'
                    }`}
                  >
                    {option.text}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ===== 底部提示 ===== */}
      <p className="text-xs text-center text-gray-400 mt-8">
        点击选项自动跳转下一题，超时自动跳过
      </p>
    </div>
  )
}

export default AssessmentPage
