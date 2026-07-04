/**
 * 测评结果页 — V3.0 CEFR 六级展示
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AssessmentResult, CefrLevel } from '../../types/assessment'
import { CEFR_CONFIG } from '../../types/assessment'
import Skeleton from '../../components/ui/Skeleton'

interface DimensionItem {
  key: 'vocabScore' | 'grammarScore' | 'readingScore' | 'listeningScore'
  label: string
  icon: React.ReactNode
}

const IconVocab = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
)

const IconGrammar = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
  </svg>
)

const IconReading = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const IconListening = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 11.314M6.5 8.8l5.4-3.9c.5-.3 1.1-.1 1.4.4.1.2.2.4.2.7v12c0 .6-.4 1-1 1-.3 0-.6-.1-.8-.3l-5.2-3.9H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.5z" />
  </svg>
)

const DIMENSIONS: DimensionItem[] = [
  { key: 'vocabScore', label: '词汇', icon: <IconVocab /> },
  { key: 'grammarScore', label: '语法', icon: <IconGrammar /> },
  { key: 'readingScore', label: '阅读', icon: <IconReading /> },
  { key: 'listeningScore', label: '听力', icon: <IconListening /> },
]

function getScoreBarColor(score: number): string {
  if (score >= 71) return '#10B981'
  if (score >= 41) return '#F59E0B'
  return '#EF4444'
}

function ResultSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
        <Skeleton variant="circular" width={120} height={120} className="mx-auto mb-4" />
        <Skeleton variant="text" width="60%" height={28} className="mx-auto mb-2" />
        <Skeleton variant="text" width="40%" height={16} className="mx-auto" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <Skeleton variant="text" width="30%" height={16} className="mb-4" />
        <div className="space-y-4">
          {DIMENSIONS.map((d) => (
            <div key={d.key} className="flex items-center gap-3">
              <Skeleton variant="text" width={40} height={16} />
              <Skeleton variant="text" height={8} className="flex-1 rounded-full" />
              <Skeleton variant="text" width={40} height={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target <= 0) { setValue(0); return }
    const startTime = performance.now()
    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

const AssessmentResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const result = location.state?.result as AssessmentResult | undefined

  useEffect(() => {
    if (!result) navigate('/assessment', { replace: true })
  }, [result, navigate])

  const displayScore = useCountUp(result?.totalScore ?? 0)

  if (!result) return <ResultSkeleton />

  const cefrLevel = (result.cefrLevel || 'A1') as CefrLevel
  const cefrConfig = CEFR_CONFIG[cefrLevel] ?? CEFR_CONFIG.A1

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in-up">
      {/* CEFR 等级徽章 + 总分 */}
      <div className="clay-card p-8 text-center mb-6">
        {/* 等级徽章 */}
        <div className={`w-32 h-32 mx-auto mb-5 rounded-full bg-gradient-to-br ${cefrConfig.bgGradient}
                        ring-4 ${cefrConfig.ring} flex flex-col items-center justify-center shadow-xl`}>
          <span className="text-4xl font-extrabold text-white drop-shadow-sm"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            {displayScore}
          </span>
          <span className="text-xs text-white/80 mt-0.5 font-medium">分</span>
        </div>

        {/* 等级标签 */}
        <h2 className="text-xl font-extrabold text-teal-800 mb-1" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          {result.levelLabel || cefrConfig.label}
        </h2>
        <p className="text-sm text-teal-500/60 font-medium">
          {cefrConfig.description} · 答对 {result.correctCount}/{result.totalQuestions} 题
        </p>
      </div>

      {/* 四维得分 */}
      <div className="clay-card p-6 mb-6">
        <h3 className="text-sm font-bold text-teal-700 mb-5" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          各项能力评分
        </h3>
        <div className="space-y-5">
          {DIMENSIONS.map((dim) => {
            const score = result[dim.key]
            const widthPercent = Math.min(Math.max(score, 0), 100)
            const color = getScoreBarColor(score)

            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-teal-700">
                    <span className="text-teal-400">{dim.icon}</span>
                    {dim.label}
                  </span>
                  <span className="text-sm font-bold text-teal-800 tabular-nums">
                    {score}
                    <span className="text-xs text-teal-400/60 font-medium"> 分</span>
                  </span>
                </div>
                <div className="h-2.5 bg-teal-100/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${widthPercent}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 学习建议 */}
      <div className="clay-card p-6 mb-8">
        <h3 className="text-sm font-bold text-teal-700 mb-3" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          学习建议
        </h3>
        <p className="text-sm text-teal-700/70 leading-relaxed">{result.message}</p>
      </div>

      {/* 底部按钮 */}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => navigate('/learning', { state: { cefrLevel, fromAssessment: true } })}
          className="clay-btn w-full py-3 text-sm">
          查看个性化学习路径
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/practice')}
            className="flex-1 py-3 text-sm font-semibold text-teal-600 bg-white rounded-xl border-2 border-teal-200/60
                       hover:border-teal-300 hover:bg-teal-50/50 active:scale-[0.98] transition-all"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            自由练习
          </button>
          <button type="button" onClick={() => navigate('/assessment', { replace: true })}
            className="flex-1 py-3 text-sm font-semibold text-teal-600 bg-white rounded-xl border-2 border-teal-200/60
                       hover:border-teal-300 hover:bg-teal-50/50 active:scale-[0.98] transition-all"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            重新测评
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssessmentResultPage
