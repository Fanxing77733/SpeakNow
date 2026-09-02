/**
 * 水平测评页 — V3.0 随机30题测评
 *
 * 从题库随机抽取：听力10 + 词汇7 + 语法7 + 阅读6
 * 每次测评题目不同，同题型集中排列（听力→词汇→语法→阅读）。
 * 听力题使用后端 Edge TTS 合成真实语音，绝不展示听力原文。
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { QuestionVO, Option, AnswerItem } from '../../types/assessment'
import { QUESTION_TYPE_LABELS } from '../../types/assessment'
import { getQuestions, submitAnswers } from '../../api/assessment'
import { synthesizeTTS } from '../../api/tts'
import Skeleton from '../../components/ui/Skeleton'

const TIME_PER_QUESTION = 60
const TRANSITION_MS = 200

/** 兜底清洗：移除旧版数据中嵌套在 questionText 里的 [Audio transcript: "..."] */
function cleanLegacyTranscript(text: string): { cleanText: string; extractedTranscript: string | null } {
  const match = text.match(/\[Audio transcript:\s*"([^"]*)"\]/)
  if (!match) return { cleanText: text, extractedTranscript: null }
  const extracted = match[1] || null
  const cleaned = text.replace(/\s*\[Audio transcript:\s*"[^"]*"\]\s*/, '\n\n').replace(/\n{3,}/g, '\n\n').trim()
  return { cleanText: cleaned, extractedTranscript: extracted }
}

/** 解析选项 JSON */
function parseOptions(optionsJson: string): Option[] {
  try {
    const parsed = JSON.parse(optionsJson)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return []
  } catch {
    return []
  }
}

function AssessmentSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-8">
        <Skeleton variant="text" width="100%" height={8} className="rounded-full" />
        <div className="flex justify-between mt-2">
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={40} height={14} />
        </div>
      </div>
      <Skeleton variant="text" width="50%" height={24} className="mb-6" />
      <Skeleton variant="text" width="90%" height={18} className="mb-2" />
      <Skeleton variant="text" width="75%" height={18} className="mb-8" />
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

  const [questions, setQuestions] = useState<QuestionVO[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerItem[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [audioLoading, setAudioLoading] = useState(false)

  const isTransitioningRef = useRef(false)
  const currentIndexRef = useRef(0)
  const questionsRef = useRef<QuestionVO[]>([])
  const answersRef = useRef<AnswerItem[]>([])
  const submittingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // 缓存已合成的音频 Blob URL，避免重复请求 TTS
  const audioCacheRef = useRef<Map<string, string>>(new Map())

  useEffect(() => { isTransitioningRef.current = isTransitioning }, [isTransitioning])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { submittingRef.current = submitting }, [submitting])

  /** 停止所有正在播放的音频（TTS 音频 + 浏览器语音合成） */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
  }, [])

  // 组件卸载时清理音频和缓存
  useEffect(() => {
    return () => {
      stopAudio()
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
      audioCacheRef.current.clear()
    }
  }, [stopAudio])

  /** 通过后端 Edge TTS 合成真实语音并播放，失败降级到浏览器 TTS */
  async function playListeningAudio(text: string, autoPlay: boolean = false): Promise<void> {
    // 检查缓存
    const cached = audioCacheRef.current.get(text)
    if (cached) {
      playAudioUrl(cached)
      return
    }

    if (!autoPlay) setAudioLoading(true)
    try {
      const blob = await synthesizeTTS(text)
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob)
        audioCacheRef.current.set(text, url)
        playAudioUrl(url)
        return
      }
    } catch {
      // 后端 TTS 失败，降级到浏览器 TTS
    } finally {
      setAudioLoading(false)
    }
    // 兜底：使用浏览器内置 TTS
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  function playAudioUrl(url: string): void {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play().catch(() => { /* autoplay blocked, ignore */ })
  }

  // 听力题自动播放（使用后端 TTS）
  const hasAutoPlayedRef = useRef(false)

  useEffect(() => {
    hasAutoPlayedRef.current = false
  }, [currentIndex])

  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (currentIndex >= questions.length) return
    const q = questions[currentIndex]
    if (q.type !== 'listening') return
    // 优先使用 transcript 字段，兜底从 questionText 中提取旧版 [Audio transcript: "..."]
    const effectiveTranscript = q.transcript || cleanLegacyTranscript(q.questionText).extractedTranscript
    if (!effectiveTranscript) return
    if (hasAutoPlayedRef.current) return

    hasAutoPlayedRef.current = true
    const timer = setTimeout(() => playListeningAudio(effectiveTranscript, true), 400)
    return () => clearTimeout(timer)
  }, [currentIndex, loading, submitting, questions])

  // 获取题目
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

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  // 倒计时
  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (currentIndex >= questions.length) return

    setTimeLeft(TIME_PER_QUESTION)
    setSelectedOption(null)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
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
  }, [currentIndex, loading, submitting, questions.length])

  // 退出提示
  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (currentIndex >= questions.length) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [loading, submitting, questions.length, currentIndex])

  // 超时
  const handleTimeout = useCallback(() => {
    if (isTransitioningRef.current || submittingRef.current) return
    const idx = currentIndexRef.current
    const qs = questionsRef.current
    if (idx >= qs.length) return

    isTransitioningRef.current = true
    setIsTransitioning(true)

    const newAnswer: AnswerItem = { questionId: qs[idx].id, selectedKey: '' }
    const newAnswers = [...answersRef.current, newAnswer]
    setAnswers(newAnswers)

    setTimeout(() => advanceOrSubmit(idx, qs, newAnswers), TRANSITION_MS)
  }, [])

  // 点击选项
  const handleSelectOption = useCallback((key: string) => {
    if (isTransitioningRef.current || submittingRef.current) return
    const idx = currentIndexRef.current
    const qs = questionsRef.current
    if (idx >= qs.length) return

    isTransitioningRef.current = true
    setIsTransitioning(true)
    setSelectedOption(key)

    const newAnswer: AnswerItem = { questionId: qs[idx].id, selectedKey: key }
    const newAnswers = [...answersRef.current, newAnswer]
    setAnswers(newAnswers)

    setTimeout(() => advanceOrSubmit(idx, qs, newAnswers), TRANSITION_MS)
  }, [])

  const submitAll = useCallback(async (allAnswers: AnswerItem[]) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)

    try {
      const result = await submitAnswers(allAnswers)
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
            case 400: setError('答案数据有误，请重新开始测评'); break
            case 401: setError('登录已过期，请重新登录'); break
            case 503: setError('评分服务繁忙，请稍后重试'); break
            default: setError('提交失败，请检查网络后重试')
          }
        }
      } else {
        setError('提交失败，请检查网络后重试')
      }
    }
  }, [navigate])

  const advanceOrSubmit = useCallback((idx: number, qs: QuestionVO[], allAnswers: AnswerItem[]) => {
    stopAudio()
    if (idx < qs.length - 1) {
      setCurrentIndex(idx + 1)
      setIsTransitioning(false)
      isTransitioningRef.current = false
    } else {
      submitAll(allAnswers)
    }
  }, [stopAudio, submitAll])

  // ---- 渲染 ----

  if (loading) return <AssessmentSkeleton />

  if (error && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="clay-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-teal-800 mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          暂时无法开始测评
        </h2>
        <p className="text-sm text-teal-600/50 mb-6">{error}</p>
        <button type="button" onClick={fetchQuestions} className="clay-btn px-6 py-2.5 text-sm">
          重新加载
        </button>
      </div>
    )
  }

  if (submitting && questions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-50 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-teal-800 mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          正在评估你的英语水平...
        </h2>
        <p className="text-sm text-teal-600/50">请稍候，结果马上出来</p>
      </div>
    )
  }

  if (error && questions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-teal-800 mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          提交测评时出现问题
        </h2>
        <p className="text-sm text-teal-600/50 mb-6">{error}</p>
        <button type="button" onClick={() => { setError(null); submitAll(answersRef.current) }} className="clay-btn px-6 py-2.5 text-sm">
          重试提交
        </button>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-teal-600/50">题库维护中，请稍后再试</p>
      </div>
    )
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-teal-600/50">题目加载异常，请重新开始</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const options = parseOptions(currentQuestion.optionsJson)
  const progressPercent = ((currentIndex + 1) / questions.length) * 100
  const questionTypeLabel = QUESTION_TYPE_LABELS[currentQuestion.type]
  const isLastTen = timeLeft <= 10 && timeLeft > 0
  const progress = currentIndex + 1
  const total = questions.length
  const isListening = currentQuestion.type === 'listening'
  // 兜底：兼容旧版数据 questionText 内嵌 [Audio transcript: "..."] 的情况
  const { cleanText: displayText, extractedTranscript } = cleanLegacyTranscript(currentQuestion.questionText)
  const effectiveTranscript = currentQuestion.transcript || extractedTranscript

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in-up">
      {/* 进度条 */}
      <div className="mb-6">
        <div className="h-2.5 bg-teal-100/50 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ background: 'linear-gradient(90deg, #0D9488, #2DD4BF)', width: `${progressPercent}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
              {questionTypeLabel}
            </span>
            <span className="text-sm font-medium text-teal-600/60">{progress}/{total}</span>
          </div>
          <div className={`flex items-center gap-1 font-mono text-lg font-bold tabular-nums ${isLastTen ? 'text-red-500 animate-countdown-pulse' : 'text-teal-700'}`}>
            <svg className={`w-4 h-4 ${isLastTen ? 'text-red-500' : 'text-teal-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeLeft}</span>
            <span className="text-xs font-normal text-teal-400/60 ml-0.5">秒</span>
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* 听力题：后端 TTS 播放按钮，绝不展示听力原文 */}
        {isListening && effectiveTranscript && (
          <div className="mb-5">
            <button
              type="button"
              disabled={audioLoading}
              onClick={() => playListeningAudio(effectiveTranscript)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-50 border-2 border-teal-200
                         text-teal-700 text-sm font-semibold hover:bg-teal-100 active:scale-95 transition-all
                         shadow-sm disabled:opacity-60 disabled:cursor-wait"
            >
              {audioLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  正在合成语音...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l5.4-3.9c.5-.3 1.1-.1 1.4.4.1.2.2.4.2.7v12c0 .6-.4 1-1 1-.3 0-.6-.1-.8-.3l-5.2-3.9H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.5z" />
                  </svg>
                  播放音频（可重复点击）
                </>
              )}
            </button>
          </div>
        )}

        {/* 题目文本 */}
        <h2 className="text-lg font-semibold text-teal-900 leading-relaxed mb-8">
          {displayText}
        </h2>

        {/* 选项列表 */}
        <div className="space-y-3">
          {options.length === 0 ? (
            <p className="text-sm text-teal-500 text-center py-8">题目选项加载异常，请刷新重试</p>
          ) : (
            options.map((option) => {
              const isSelected = selectedOption === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={isTransitioning}
                  onClick={() => handleSelectOption(option.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer
                    ${isSelected
                      ? 'border-teal-400 bg-teal-50 shadow-md scale-[0.98]'
                      : 'border-teal-200/60 bg-white hover:border-teal-300 hover:bg-teal-50/30 active:scale-[0.98]'}`}
                  aria-label={`选项 ${option.key}: ${option.text}`}
                >
                  <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${isSelected ? 'text-white' : 'bg-teal-50 text-teal-600'}`}
                    style={isSelected ? { background: 'linear-gradient(135deg, #0D9488, #2DD4BF)' } : undefined}>
                    {option.key}
                  </span>
                  <span className={`text-sm leading-relaxed flex-1 ${isSelected ? 'text-teal-700 font-semibold' : 'text-teal-800'}`}>
                    {option.text}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <p className="text-xs text-center text-teal-400/50 mt-8 font-medium">
        点击选项自动跳转下一题，超时自动跳过
      </p>
    </div>
  )
}

export default AssessmentPage
