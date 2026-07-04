/**
 * 对话评分弹窗 — Claymorphism 风格
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ScoreResult } from '../types/conversation'

interface ScoreModalProps {
  scoreResult: ScoreResult
  visible: boolean
  onNewSession: () => void
  onClose: () => void
  learningTaskId?: number
}

function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = (target * eased)
      setValue(Math.round(current * 10) / 10)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

function ScoreBar({ label, score, weight, color }: { label: string; score: number; weight?: string; color: string }) {
  const displayScore = useCountUp(score)
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-teal-700">
          {label}{weight ? <span className="text-xs text-teal-400 ml-1">({weight})</span> : null}
        </span>
        <span className="text-sm font-bold" style={{ color }}>{displayScore.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-teal-100/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

const ScoreModal = ({ scoreResult, visible, onNewSession, onClose, learningTaskId }: ScoreModalProps) => {
  const navigate = useNavigate()
  const displayTotal = useCountUp(scoreResult.totalScore)
  const totalColor = getScoreColor(scoreResult.totalScore)
  const hasPassFail = scoreResult.passScore != null && scoreResult.isPassed != null
  const hasExtraDimensions = scoreResult.vocabularyScore != null && scoreResult.pronunciationScore != null && scoreResult.interactionScore != null

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="clay-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-score-count-in" role="dialog" aria-modal="true" aria-label="对话评分结果">
        {/* 总分区域 */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-sm text-teal-600/50 font-semibold mb-2">对话评分</p>
          <div className="text-6xl font-extrabold transition-colors duration-500" style={{ fontFamily: 'Poppins, system-ui, sans-serif', color: totalColor }}>
            {displayTotal.toFixed(1)}
          </div>

          {/* 等级标签 */}
          {scoreResult.levelLabel && (
            <div className="mt-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-400 to-emerald-400 text-white">
                {scoreResult.levelLabel}
              </span>
            </div>
          )}

          {/* 通过/未通过 */}
          {hasPassFail && (
            <div className="mt-2">
              {scoreResult.isPassed ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  ✓ 已通过 (需 ≥{scoreResult.passScore}分)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                  ✗ 未通过 (需 ≥{scoreResult.passScore}分)
                </span>
              )}
            </div>
          )}

          {!hasPassFail && !scoreResult.levelLabel && <p className="text-xs text-teal-400/60 mt-1 font-medium">满分 100 分</p>}
        </div>

        {/* 六维分进度条 */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-teal-600/50 uppercase tracking-wide mb-3">评分维度</p>
          <ScoreBar label="语法" score={scoreResult.grammarScore} weight="40%" color={getScoreColor(scoreResult.grammarScore)} />
          <ScoreBar label="相关性" score={scoreResult.relevanceScore} weight="30%" color={getScoreColor(scoreResult.relevanceScore)} />
          <ScoreBar label="流利度" score={scoreResult.fluencyScore} weight="30%" color={getScoreColor(scoreResult.fluencyScore)} />
          {hasExtraDimensions && (
            <>
              <div className="border-t border-teal-100/50 my-3" />
              <ScoreBar label="词汇丰富度" score={scoreResult.vocabularyScore!} color={getScoreColor(scoreResult.vocabularyScore!)} />
              <ScoreBar label="发音" score={scoreResult.pronunciationScore!} color={getScoreColor(scoreResult.pronunciationScore!)} />
              <ScoreBar label="互动自然度" score={scoreResult.interactionScore!} color={getScoreColor(scoreResult.interactionScore!)} />
            </>
          )}
        </div>

        {/* AI 综合评语 */}
        <div className="px-6 pb-4">
          <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100/50">
            <p className="text-xs text-teal-400/60 mb-1 font-medium">AI 评委点评</p>
            <p className="text-sm text-teal-800 leading-relaxed">{scoreResult.comment}</p>
          </div>
        </div>

        {/* 优点 & 待改进 */}
        {(scoreResult.strengths || scoreResult.weaknesses) && (
          <div className="px-6 pb-4 grid grid-cols-1 gap-3">
            {scoreResult.strengths && scoreResult.strengths.length > 0 && (
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                <p className="text-xs font-semibold text-emerald-600 mb-2">做得好的地方</p>
                <ul className="space-y-1.5">
                  {scoreResult.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-emerald-800 flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5 shrink-0">&#8226;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {scoreResult.weaknesses && scoreResult.weaknesses.length > 0 && (
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                <p className="text-xs font-semibold text-amber-600 mb-2">可以改进的地方</p>
                <ul className="space-y-1.5">
                  {scoreResult.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5 shrink-0">&#8226;</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 语法错误纠错 */}
        {scoreResult.grammarErrors && scoreResult.grammarErrors.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50">
              <p className="text-xs font-semibold text-red-500 mb-3">语法纠错建议</p>
              <div className="space-y-3">
                {scoreResult.grammarErrors.map((e, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="line-through text-red-500 bg-red-100 px-2 py-0.5 rounded">{e.error}</span>
                      <span className="text-teal-400">→</span>
                      <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{e.correction}</span>
                    </div>
                    <p className="text-xs text-red-400">{e.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 推荐地道表达 */}
        {scoreResult.suggestedExpressions && scoreResult.suggestedExpressions.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
              <p className="text-xs font-semibold text-indigo-500 mb-3">推荐地道表达</p>
              <ul className="space-y-1.5">
                {scoreResult.suggestedExpressions.map((exp, i) => (
                  <li key={i} className="text-sm text-indigo-800 flex items-start gap-1.5">
                    <span className="text-indigo-300 mt-0.5 shrink-0">&#8226;</span>
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="px-6 pb-6 flex gap-3">
          {learningTaskId && (
            <button type="button" onClick={() => { onClose(); navigate('/learning') }}
              className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors active:scale-95"
              style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              返回学习路径
            </button>
          )}
          <button type="button" onClick={() => { onClose(); navigate('/progress') }}
            className="flex-1 py-3 text-sm font-semibold text-teal-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors active:scale-95"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            查看进度
          </button>
          <button type="button" onClick={onNewSession} className="clay-btn flex-1 py-3 text-sm">
            再来一局
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScoreModal
