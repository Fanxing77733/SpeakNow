/**
 * 对话评分弹窗
 *
 * 对话结束后展示：
 * - 总分（数字渐增动画 0.8s）
 * - 三维分进度条：语法(40%) + 相关性(30%) + 流利度(30%)
 * - AI 综合评语
 * - 底部操作按钮："再来一局" / "查看进度"
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ScoreResult } from '../types/conversation'

interface ScoreModalProps {
  /** 评分结果数据 */
  scoreResult: ScoreResult
  /** 是否可见 */
  visible: boolean
  /** 关闭回调（再来一局） */
  onNewSession: () => void
  /** 再来一局按钮点击 */
  onClose: () => void
}

/** 数字渐增动画 Hook */
function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()
    const startValue = 0

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out 缓动
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (target - startValue) * eased
      setValue(Math.round(current * 10) / 10)

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

/** 单维度分数进度条 */
function ScoreBar({
  label,
  score,
  weight,
  color,
}: {
  label: string
  score: number
  weight: string
  color: string
}) {
  const displayScore = useCountUp(score)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">
          {label}{' '}
          <span className="text-xs text-gray-400">({weight})</span>
        </span>
        <span className="text-sm font-semibold" style={{ color }}>
          {displayScore.toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(score, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

/** 分数颜色映射 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green-500
  if (score >= 60) return '#eab308' // yellow-500
  return '#ef4444' // red-500
}

const ScoreModal = ({ scoreResult, visible, onNewSession, onClose }: ScoreModalProps) => {
  const navigate = useNavigate()
  const displayTotal = useCountUp(scoreResult.totalScore)
  const totalColor = getScoreColor(scoreResult.totalScore)

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-score-count-in"
        role="dialog"
        aria-modal="true"
        aria-label="对话评分结果"
      >
        {/* 总分区域 */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-sm text-gray-500 mb-2">对话评分</p>
          <div
            className="text-6xl font-bold transition-colors duration-500"
            style={{ color: totalColor }}
          >
            {displayTotal.toFixed(1)}
          </div>
          <p className="text-xs text-gray-400 mt-1">满分 100 分</p>
        </div>

        {/* 三维分进度条 */}
        <div className="px-6 py-4">
          <ScoreBar
            label="语法"
            score={scoreResult.grammarScore}
            weight="40%"
            color={getScoreColor(scoreResult.grammarScore)}
          />
          <ScoreBar
            label="相关性"
            score={scoreResult.relevanceScore}
            weight="30%"
            color={getScoreColor(scoreResult.relevanceScore)}
          />
          <ScoreBar
            label="流利度"
            score={scoreResult.fluencyScore}
            weight="30%"
            color={getScoreColor(scoreResult.fluencyScore)}
          />
        </div>

        {/* AI 综合评语 */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">AI 评委点评</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {scoreResult.comment}
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/progress')
            }}
            className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            查看进度
          </button>
          <button
            type="button"
            onClick={onNewSession}
            className="flex-1 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScoreModal
