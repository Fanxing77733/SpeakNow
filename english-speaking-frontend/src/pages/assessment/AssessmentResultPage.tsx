/**
 * 测评结果页 — V1.0
 *
 * 展示内容：
 * - 评级徽章（金色 advanced / 银色 intermediate / 铜色 beginner）
 * - 总分数：大号数字，从 0 滚动到目标值的渐增动画（0.8s）
 * - 四维得分条（词汇/语法/阅读/听力）：进度条渐变色（红→黄→绿）
 * - 等级评语（message 字段）
 * - 底部按钮："开始练习" / "重新测评"
 *
 * 安全要求：
 * - 不展示逐题 correct_answer
 * - 直接访问此页（无测评结果）→ 重定向到 /assessment
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AssessmentResult } from '../../types/assessment'
import { LEVEL_CONFIG } from '../../types/assessment'
import Skeleton from '../../components/ui/Skeleton'

/** 四维得分项配置 */
interface DimensionItem {
  key: 'vocabScore' | 'grammarScore' | 'readingScore' | 'listeningScore'
  label: string
}

const DIMENSIONS: DimensionItem[] = [
  { key: 'vocabScore', label: '词汇' },
  { key: 'grammarScore', label: '语法' },
  { key: 'readingScore', label: '阅读' },
  { key: 'listeningScore', label: '听力' },
]

/**
 * 根据分数返回进度条渐变色
 * 低分段（0-40）红色，中分段（41-70）黄色，高分段（71-100）绿色
 */
function getScoreBarColor(score: number): string {
  if (score >= 71) return 'bg-gradient-to-r from-yellow-400 to-green-500'
  if (score >= 41) return 'bg-gradient-to-r from-orange-400 to-yellow-400'
  return 'bg-gradient-to-r from-red-400 to-orange-400'
}

/** 总分圆环骨架屏 */
function ResultSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 总分卡片骨架 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
        <Skeleton variant="circular" width={120} height={120} className="mx-auto mb-4" />
        <Skeleton variant="text" width="60%" height={28} className="mx-auto mb-2" />
        <Skeleton variant="text" width="40%" height={16} className="mx-auto" />
      </div>
      {/* 四维分数骨架 */}
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

/** 数字渐增动画 Hook */
function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target <= 0) {
      setValue(0)
      return
    }

    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic: 先快后慢，更自然
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration])

  return value
}

const AssessmentResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // 从路由 state 获取测评结果
  const result = location.state?.result as AssessmentResult | undefined

  // 直接访问（无测评结果）→ 重定向
  useEffect(() => {
    if (!result) {
      navigate('/assessment', { replace: true })
    }
  }, [result, navigate])

  // 数字渐增动画
  const displayScore = useCountUp(result?.totalScore ?? 0)

  // 无结果时显示骨架，等待重定向
  if (!result) {
    return <ResultSkeleton />
  }

  const levelConfig = LEVEL_CONFIG[result.resultLevel] ?? LEVEL_CONFIG.beginner

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ===== 评级徽章 + 总分 ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
        {/* 评级徽章：大号圆形 */}
        <div
          className={`w-28 h-28 mx-auto mb-4 rounded-full bg-gradient-to-br ${levelConfig.bgGradient}
                      ring-4 ${levelConfig.ring} flex flex-col items-center justify-center
                      shadow-lg`}
        >
          <span className="text-4xl font-bold text-white drop-shadow-sm">
            {displayScore}
          </span>
          <span className="text-xs text-white/80 mt-0.5">分</span>
        </div>

        {/* 评级文字 */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          你的英语水平：{levelConfig.label}
        </h2>
        <p className="text-sm text-gray-500">{levelConfig.badgeLabel}</p>
      </div>

      {/* ===== 四维得分条 ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">各项能力评分</h3>

        <div className="space-y-5">
          {DIMENSIONS.map((dim) => {
            const score = result[dim.key]
            const widthPercent = Math.min(Math.max(score, 0), 100)

            return (
              <div key={dim.key}>
                {/* 标签 + 分数 */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{dim.label}</span>
                  <span className="text-sm font-semibold text-gray-800 tabular-nums">
                    {score}
                    <span className="text-xs text-gray-400 font-normal"> 分</span>
                  </span>
                </div>

                {/* 进度条 */}
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getScoreBarColor(score)}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== 等级评语 ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">学习建议</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{result.message}</p>
      </div>

      {/* ===== 底部按钮 ===== */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="flex-1 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl
                     hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
        >
          开始练习
        </button>
        <button
          type="button"
          onClick={() => navigate('/assessment', { replace: true })}
          className="flex-1 px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-xl
                     border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50
                     active:scale-[0.98] transition-all"
        >
          重新测评
        </button>
      </div>
    </div>
  )
}

export default AssessmentResultPage
