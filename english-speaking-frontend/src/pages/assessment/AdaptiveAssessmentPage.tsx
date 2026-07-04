/**
 * 自适应测评页（V2.1）
 *
 * 基于数据库真实题目的 IRT 自适应出题。
 * 每次从50题库中按难度选最接近的未用题目。
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../api/client'
import { synthesizeTTS } from '../../api/tts'
import Skeleton from '../../components/ui/Skeleton'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

interface AdaptiveQuestion {
  id: number
  type: string
  questionText: string
  transcript?: string | null
  options: Record<string, string>
  optionsJson?: string
  difficulty?: number
}

interface AdaptiveResponse {
  sessionActive?: boolean
  completed?: boolean
  questionCount?: number
  estimatedLevel?: string
  converged?: boolean
  question?: AdaptiveQuestion
  totalQuestions?: number
  totalScore?: number
  correctCount?: number
  cefrLevel?: string
  abilityTheta?: string
  recordId?: number
  vocabScore?: number
  grammarScore?: number
  readingScore?: number
  listeningScore?: number
  radarData?: Array<{ dimension: string; score: number; fullMark: number }>
  suggestion?: string
}

const TYPE_LABELS: Record<string, string> = { vocab: '词汇', grammar: '语法', reading: '阅读', listening: '听力' }

/** 兜底清洗：移除旧版数据中嵌套在 questionText 里的 [Audio transcript: "..."] */
function cleanLegacyTranscript(text: string): { cleanText: string; extractedTranscript: string | null } {
  const match = text.match(/\[Audio transcript:\s*"([^"]*)"\]/)
  if (!match) return { cleanText: text, extractedTranscript: null }
  const extracted = match[1] || null
  const cleaned = text.replace(/\s*\[Audio transcript:\s*"[^"]*"\]\s*/, '\n\n').replace(/\n{3,}/g, '\n\n').trim()
  return { cleanText: cleaned, extractedTranscript: extracted }
}

const CEFR_COLORS: Record<string, string> = {
  A1: '#F59E0B', A2: '#F97316', B1: '#3B82F6', B2: '#6366F1', C1: '#0D9488', C2: '#7C3AED',
}

const AdaptiveAssessmentPage = () => {
  const navigate = useNavigate()
  const [question, setQuestion] = useState<AdaptiveQuestion | null>(null)
  const [qCount, setQCount] = useState(0)
  const [estLevel, setEstLevel] = useState('B1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(45)
  const [result, setResult] = useState<AdaptiveResponse | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 清理 timer / audio
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  /** 通过后端 Edge TTS 合成真实语音并播放，失败降级到浏览器 TTS */
  async function playListeningAudio(text: string): Promise<void> {
    setAudioLoading(true)
    try {
      const blob = await synthesizeTTS(text)
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob)
        if (audioRef.current) audioRef.current.pause()
        const audio = new Audio(url)
        audioRef.current = audio
        audio.play().catch(() => { /* autoplay blocked */ })
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

  // 听力题自动朗读（后端 TTS），兜底兼容旧版内嵌 transcript 格式
  useEffect(() => {
    if (question?.type === 'listening') {
      const effectiveTranscript = question.transcript || cleanLegacyTranscript(question.questionText).extractedTranscript
      if (effectiveTranscript) {
        const timer = setTimeout(() => playListeningAudio(effectiveTranscript), 400)
        return () => clearTimeout(timer)
      }
    }
  }, [question?.id])

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    let t = 45
    setTimeLeft(t)
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleAnswer('')
      }
    }, 1000)
  }

  const startAssessment = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await request<AdaptiveResponse>({ method: 'GET', url: '/assessment/adaptive/start' })
      setQuestion(data.question!)
      setQCount(data.questionCount!)
      setEstLevel(data.estimatedLevel!)
      startTimer()
    } catch {
      setError('服务繁忙，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAnswer = async (key: string) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!question) return
    setLoading(true)
    try {
      const data = await request<AdaptiveResponse>({
        method: 'POST',
        url: '/assessment/adaptive/answer',
        data: { questionId: question.id, selectedKey: key },
      })
      if (data.completed) {
        setResult(data)
        setQuestion(null)
      } else {
        setQuestion(data.question!)
        setQCount(data.questionCount!)
        setEstLevel(data.estimatedLevel!)
        setTimeLeft(45)
        startTimer()
      }
    } catch {
      setError('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // ==== 结果页 ====
  if (result?.completed) {
    const cefrColor = CEFR_COLORS[result.cefrLevel || 'A1'] || '#3B82F6'
    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-teal-800 mb-1" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          测评完成
        </h1>
        <p className="text-sm text-teal-600/50 mb-6 font-medium">
          自适应测评 · 共 {result.totalQuestions} 题
          {result.totalScore != null && ` · 得分 ${result.totalScore} · 答对 ${result.correctCount}/${result.totalQuestions}`}
        </p>

        {/* CEFR 等级 */}
        <div className="clay-card p-8 text-center mb-6">
          <p className="text-sm text-teal-600/50 font-medium mb-2">你的 CEFR 等级</p>
          <div className="text-7xl font-extrabold mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif', color: cefrColor }}>
            {result.cefrLevel}
          </div>
          <p className="text-xs text-teal-400/60">能力值 θ = {result.abilityTheta}</p>
        </div>

        {/* 雷达图 */}
        {result.radarData && result.radarData.length > 0 && (
          <div className="clay-card p-6 mb-6">
            <h3 className="text-sm font-bold text-teal-700 mb-4" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              能力分布
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={result.radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#ccfbf1" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13, fill: '#0F766E' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Radar name="能力值" dataKey="score" stroke={cefrColor} fill={cefrColor} fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 学习建议 */}
        <div className="clay-card p-6 mb-8">
          <h3 className="text-sm font-bold text-teal-700 mb-3" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            学习建议
          </h3>
          <p className="text-sm text-teal-700/70 leading-relaxed">{result.suggestion}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setResult(null); startAssessment() }}
            className="clay-btn flex-1 py-3 text-sm">
            重新测评
          </button>
          <button onClick={() => navigate('/progress')}
            className="flex-1 py-3 text-sm font-semibold text-teal-600 bg-white rounded-xl border-2 border-teal-200/60
                       hover:border-teal-300 hover:bg-teal-50/50 active:scale-[0.98] transition-all"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            查看进度
          </button>
        </div>
      </div>
    )
  }

  // ==== 开始页 ====
  if (!question && !loading) {
    return (
      <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-teal-800 mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          自适应英语测评
        </h1>
        <p className="text-sm text-teal-600/50 mb-8 font-medium">
          基于 IRT 算法的智能测评，系统根据你的答题表现动态调整难度，
          精准定位 CEFR 等级（A1-C2），生成个性化学习建议。
        </p>

        <div className="clay-card p-6 mb-6 text-left">
          <h3 className="font-bold text-teal-800 mb-3" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>测评说明</h3>
          <ul className="space-y-2 text-sm text-teal-700/70">
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              系统根据你的答题表现自动调整题目难度
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              共 15-30 题，每题限时 45 秒
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              所有题目来自真实题库（词汇/语法/阅读/听力）
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-1 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              结果包含 CEFR 等级 + 四维能力雷达图 + 学习建议
            </li>
          </ul>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button onClick={startAssessment} disabled={loading}
          className="clay-btn px-8 py-3 text-sm">
          {loading ? '加载中...' : '开始测评'}
        </button>
      </div>
    )
  }

  // ==== 加载态 ====
  if (loading && !question) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton variant="text" height={40} className="mb-4" />
        <Skeleton variant="text" height={120} />
      </div>
    )
  }

  // ==== 答题中 ====
  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度 + 倒计时 */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
          {TYPE_LABELS[question?.type ?? 'vocab'] || question?.type}
        </span>
        <span className={`text-sm font-mono font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-countdown-pulse' : 'text-teal-600/60'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="h-2 bg-teal-100/50 rounded-full mb-5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ background: 'linear-gradient(90deg, #0D9488, #2DD4BF)', width: `${Math.min((qCount / 20) * 100, 100)}%` }} />
      </div>

      {/* 听力题：后端 TTS 播放按钮，绝不展示原文 */}
      {question?.type === 'listening' && (() => {
        const effectiveTranscript = question.transcript || cleanLegacyTranscript(question.questionText).extractedTranscript
        if (!effectiveTranscript) return null
        return (
        <div className="mb-4">
          <button type="button" disabled={audioLoading}
            onClick={() => playListeningAudio(effectiveTranscript)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 border-2 border-teal-200
                       text-teal-700 text-sm font-semibold hover:bg-teal-100 active:scale-95 transition-all
                       shadow-sm disabled:opacity-60 disabled:cursor-wait">
            {audioLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                合成语音中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l5.4-3.9c.5-.3 1.1-.1 1.4.4.1.2.2.4.2.7v12c0 .6-.4 1-1 1-.3 0-.6-.1-.8-.3l-5.2-3.9H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.5z" />
                </svg>
                播放音频
              </>
            )}
          </button>
        </div>
      )})()}

      {/* 题目 */}
      <div className="clay-card p-6 mb-4">
        <p className="text-lg font-medium text-teal-900 mb-6 leading-relaxed">{(() => {
          if (!question) return ''
          return cleanLegacyTranscript(question.questionText).cleanText
        })()}</p>
        <div className="space-y-3">
          {question?.options && Object.entries(question.options).map(([key, value]) => (
            <button key={key} onClick={() => handleAnswer(key)} disabled={loading}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all duration-150
                ${loading
                  ? 'bg-gray-50 border-teal-100/50 text-teal-400/50 cursor-not-allowed'
                  : 'border-teal-200/60 hover:border-teal-400 hover:bg-teal-50/50 text-teal-700 font-medium active:scale-[0.98]'}`}>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-600 font-bold text-sm mr-3">
                {key}
              </span>
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* 当前预估等级 */}
      <p className="text-xs text-center text-teal-400/50 font-medium">
        当前预估 CEFR: <span className="font-bold text-teal-600">{estLevel}</span>
      </p>
    </div>
  )
}

export default AdaptiveAssessmentPage
