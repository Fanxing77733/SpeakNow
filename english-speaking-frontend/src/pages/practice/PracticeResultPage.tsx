/**
 * 评测结果页 — 核心页面
 *
 * 渐进式渲染三步走：
 * Step 1 (0ms)  : ASR 转写文本先展示
 * Step 2 (300ms): 总分 + 三维分数字渐增动画
 * Step 3 (600ms): 逐词颜色标记
 *   - 点击红色/黄色单词 → 弹出音素纠错面板
 *
 * 路由入口：
 * - /practice/result（从 PracticePage navigate 传入 route state）
 * - /practice/result?recordId=123（历史记录直链）
 * - 缺少 result 且无 recordId → 重定向 /practice
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getResultDetail } from '../../api/practice'
import type { PronounceEvalResult, WordResult, PhonemeResult } from '../../types/practice'

// ============================================================
// useCountUp — 数字渐增动画 Hook（0 → target，ease-out cubic）
// ============================================================
function useCountUp(target: number, start: boolean, duration = 800): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) {
      setValue(0)
      return
    }
    if (target === 0) {
      setValue(0)
      return
    }

    let rafId: number
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic: 1 - (1-t)^3
      const eased = 1 - Math.pow(1 - progress, 3)
      // 保留一位小数
      setValue(Math.round(target * eased * 10) / 10)

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, start, duration])

  return value
}

// ============================================================
// 工具函数
// ============================================================

/** 根据分数返回颜色主题（总分用） */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-500'
}

/** 根据分数返回进度条渐变色 */
function getProgressGradient(score: number): string {
  if (score >= 80) return 'from-green-400 to-green-500'
  if (score >= 60) return 'from-yellow-400 to-yellow-500'
  return 'from-red-400 to-red-500'
}

/** 根据单词颜色字段返回 Tailwind 样式 */
function getWordBlockStyle(color: string): string {
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 cursor-pointer'
    case 'red':
      return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 cursor-pointer'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

/** 根据颜色字段判断是否可点击（仅黄色/红色可点击查看音素） */
function isClickableWord(color: string): boolean {
  return color === 'yellow' || color === 'red'
}

/** 音素得分颜色 */
function getPhonemeColor(score: number): string {
  if (score >= 80) return 'bg-green-400'
  if (score >= 60) return 'bg-yellow-400'
  return 'bg-red-400'
}

/** 提取友好错误消息 */
function extractErrorMsg(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'Network Error') return '网络连接失败，请检查网络'
    if (!/(error|exception|timeout|500|503|502)/i.test(error.message)) {
      return error.message
    }
  }
  return '数据加载失败，请稍后重试'
}

// ============================================================
// 子组件
// ============================================================

/** 总分圆环骨架 */
function ScoreSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center animate-pulse">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200" />
      <div className="h-5 w-20 mx-auto bg-gray-200 rounded" />
    </div>
  )
}

/** 维度分进度条骨架 */
function DimensionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-14 bg-gray-200 rounded" />
            <div className="flex-1 h-2 bg-gray-200 rounded-full" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 单词块骨架 */
function WordsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-8 rounded-lg bg-gray-200 ${i % 3 === 0 ? 'w-16' : i % 3 === 1 ? 'w-12' : 'w-20'}`} />
        ))}
      </div>
    </div>
  )
}

/** 评分徽章 */
function ScoreBadge({ score }: { score: number }) {
  const badgeStyle = score >= 80
    ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
    : score >= 60
      ? 'bg-gray-50 text-gray-600 border-gray-300'
      : 'bg-orange-50 text-orange-700 border-orange-300'

  const badgeText = score >= 80 ? '优秀' : score >= 60 ? '良好' : '需改进'
  const badgeIcon = score >= 80 ? '★' : score >= 60 ? '●' : '▲'

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}>
      {badgeIcon} {badgeText}
    </span>
  )
}

/** 总分圆环 */
function TotalScoreCircle({ score, animated }: { score: number; animated: boolean }) {
  const displayScore = useCountUp(score, animated)
  const color = getScoreColor(score)
  const circumference = 2 * Math.PI * 42
  const progress = animated ? score / 100 : 0
  const dashOffset = circumference * (1 - progress)
  const strokeColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* 圆环背景 */}
      <svg className="w-28 h-28 md:w-32 md:h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke={strokeColor} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      {/* 分数文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl md:text-4xl font-bold tabular-nums ${color}`}>
          {displayScore.toFixed(0)}
        </span>
        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

/** 音素纠错面板 — 底部滑入（移动端）/ 居中弹窗（桌面） */
function PhonemePanel({
  word,
  wordResult,
  onClose,
}: {
  word: string
  wordResult: WordResult
  onClose: () => void
}) {
  // 点击面板外部关闭
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-label={`"${word}" 的音素纠错详情`}
    >
      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 面板内容 — 移动端底部弹出 / 桌面居中 */}
      <div className="
        relative w-full md:w-96 md:mx-4 md:rounded-2xl rounded-t-2xl
        bg-white shadow-xl animate-slide-up
        max-h-[70vh] overflow-y-auto
      ">
        {/* 拖拽指示条（移动端） */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">音素纠错</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              单词：<span className="font-mono text-gray-700">{word}</span>
              &nbsp;&nbsp;总分：<span className="font-semibold">{wordResult.score.toFixed(0)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="关闭"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 音素列表 */}
        <div className="px-5 py-4 space-y-3">
          {wordResult.phonemes.map((p: PhonemeResult, idx: number) => {
            const barColor = getPhonemeColor(p.score)
            const barWidth = Math.max(p.score, 5)
            return (
              <div key={idx} className="flex items-center gap-3">
                {/* 音素符号 */}
                <span className="w-12 text-center font-mono text-lg text-gray-800 font-medium">
                  /{p.phoneme}/
                </span>
                {/* 颜色条 */}
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {/* 分数 */}
                <span className="w-9 text-right text-sm font-semibold text-gray-700 tabular-nums">
                  {p.score.toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>

        {/* 图例 */}
        <div className="px-5 pb-5 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-400 inline-block" /> 标准
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> 一般
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-400 inline-block" /> 需改进
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 主页面组件
// ============================================================

const PracticeResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const routeState = location.state as { result?: PronounceEvalResult; sentence?: { id: number; sentence: string } } | null
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const recordIdParam = queryParams.get('recordId')

  // ========== 数据来源 ==========
  const [result, setResult] = useState<PronounceEvalResult | null>(routeState?.result ?? null)
  const [loading, setLoading] = useState(!routeState?.result && !!recordIdParam)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 从 API 加载历史记录
  useEffect(() => {
    if (routeState?.result) return // 已有 route state

    if (!recordIdParam) return // 无 recordId，下面会重定向

    const id = parseInt(recordIdParam, 10)
    if (isNaN(id)) return

    setLoading(true)
    getResultDetail(id)
      .then(setResult)
      .catch((err: unknown) => setFetchError(extractErrorMsg(err)))
      .finally(() => setLoading(false))
  }, [routeState?.result, recordIdParam])

  // ========== 渐进式渲染 ==========
  const [showStep2, setShowStep2] = useState(false)
  const [showStep3, setShowStep3] = useState(false)

  // 当 result 就绪时启动三步渲染
  useEffect(() => {
    if (!result) return
    setShowStep2(false)
    setShowStep3(false)

    const t1 = setTimeout(() => setShowStep2(true), 300)
    const t2 = setTimeout(() => setShowStep3(true), 600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [result?.recordId]) // 仅当 recordId 变化时重新触发

  // ========== 音素面板状态 ==========
  const [phonemeTarget, setPhonemeTarget] = useState<{ word: string; wordResult: WordResult } | null>(null)

  // ========== 安全守卫：无数据且无 recordId → 重定向 ==========
  if (!result && !recordIdParam && !loading) {
    navigate('/practice', { replace: true })
    return null
  }

  // ========== 加载中 ==========
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">评测结果</h1>
        <ScoreSkeleton />
        <div className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-5 w-full bg-gray-200 rounded" />
          </div>
        </div>
        <div className="mt-6">
          <DimensionSkeleton />
        </div>
      </div>
    )
  }

  // ========== 加载错误 ==========
  if (fetchError) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm mb-4">{fetchError}</p>
        <button
          onClick={() => navigate('/practice')}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          返回练习
        </button>
      </div>
    )
  }

  // ========== 无数据兜底 ==========
  if (!result) {
    navigate('/practice', { replace: true })
    return null
  }

  const { asrText, totalScore, accuracyScore, fluencyScore, completenessScore, wordResults } = result

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">评测结果</h1>

      {/* ============================================================ */}
      {/* Step 1 — ASR 转写文本（立即展示） */}
      {/* ============================================================ */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6 animate-score-count-in">
        <h3 className="text-xs font-medium text-blue-600 mb-2 uppercase tracking-wide">识别结果</h3>
        <p className="text-lg md:text-xl text-gray-900 leading-relaxed">
          {asrText || '（未能识别语音内容）'}
        </p>
        {!asrText && (
          <p className="text-xs text-blue-500 mt-1">请确保发音清晰并在安静环境中录音</p>
        )}
      </div>

      {/* ============================================================ */}
      {/* Step 2 — 总分 + 三维分（300ms 后展示） */}
      {/* ============================================================ */}
      <div
        className={`transition-all duration-500 ${
          showStep2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* 总分卡片 */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
          <TotalScoreCircle score={totalScore} animated={showStep2} />
          <h2 className="text-lg font-semibold text-gray-700 mt-3">综合评分</h2>
          <div className="mt-2">
            <ScoreBadge score={totalScore} />
          </div>
        </div>

        {/* 三维分卡片 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-5">发音详情</h3>
          <div className="space-y-4">
            <DimensionRow
              label="准确度"
              score={accuracyScore}
              animated={showStep2}
              description="单词发音的准确程度"
            />
            <DimensionRow
              label="流利度"
              score={fluencyScore}
              animated={showStep2}
              description="朗读的连贯与流畅程度"
            />
            <DimensionRow
              label="完整度"
              score={completenessScore}
              animated={showStep2}
              description="对参考文本的覆盖完整度"
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Step 3 — 逐词颜色标记（600ms 后展示） */}
      {/* ============================================================ */}
      <div
        className={`transition-all duration-500 ${
          showStep3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {showStep3 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">逐词发音分析</h3>

            {/* 图例 */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-400 inline-block" /> 标准
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> 一般
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-400 inline-block" /> 需改进
              </span>
            </div>

            {/* 单词块 */}
            <div className="flex flex-wrap gap-2">
              {wordResults.map((wr: WordResult, idx: number) => {
                const clickable = isClickableWord(wr.color)
                return (
                  <button
                    key={idx}
                    disabled={!clickable}
                    onClick={() => {
                      if (clickable) {
                        setPhonemeTarget({ word: wr.word, wordResult: wr })
                      }
                    }}
                    className={`
                      inline-block px-3 py-1.5 rounded-lg border text-sm font-medium
                      transition-all duration-200
                      ${getWordBlockStyle(wr.color)}
                      ${clickable ? 'hover:shadow-sm active:scale-95' : 'cursor-default'}
                    `}
                    title={clickable ? `点击查看"${wr.word}"的音素纠错` : undefined}
                  >
                    {wr.word}
                  </button>
                )
              })}
            </div>

            {/* 无单词结果时的兜底 */}
            {wordResults.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                暂无逐词分析数据
              </p>
            )}
          </div>
        ) : (
          <WordsSkeleton />
        )}
      </div>

      {/* ============================================================ */}
      {/* 底部操作 */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={() =>
            navigate('/practice', {
              state: routeState?.sentence
                ? { reselectId: routeState.sentence.id }
                : undefined,
            })
          }
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium
            hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          再练一次
        </button>
        <button
          onClick={() => navigate('/practice')}
          className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700
            text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          下一句
        </button>
        <button
          onClick={() => navigate('/progress')}
          className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700
            text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          查看历史
        </button>
      </div>

      {/* ============================================================ */}
      {/* 音素纠错面板（条件渲染） */}
      {/* ============================================================ */}
      {phonemeTarget && (
        <PhonemePanel
          word={phonemeTarget.word}
          wordResult={phonemeTarget.wordResult}
          onClose={() => setPhonemeTarget(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// 维度分进度条组件
// ============================================================
function DimensionRow({
  label,
  score,
  animated,
  description,
}: {
  label: string
  score: number
  animated: boolean
  description: string
}) {
  const displayScore = useCountUp(score, animated)
  const gradient = getProgressGradient(score)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${getScoreColor(score)}`}>
          {displayScore.toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700 ease-out`}
          style={{ width: animated ? `${Math.max(score, 2)}%` : '0%' }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  )
}

export default PracticeResultPage
