/**
 * 匿名互评页面（V2.0）
 *
 * 功能：
 * 1. 头部统计：待审阅数 / 已完成数 / 获得积分
 * 2. 待审阅列表：卡片展示，含句子预览、匿名用户、分配时间、"去评价"按钮
 * 3. 评价弹窗：评分滑块 1-100 + 文字评价（≤200字）→ 提交评价
 * 4. 已完成评价：底部折叠区域展示已完成的评价记录
 */
import { useState, useEffect, useCallback } from 'react'
import { getPendingReviews, submitReview, getPoints, getRecordingStats } from '../../api/gamification'
import type { ReviewAssignmentVO, ReviewStatsVO, PointsVO } from '../../types/gamification'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'

interface CompletedReview {
  id: number
  recordingId: number
  sentencePreview: string
  score: number
  comment: string
  submittedAt: string
}

const PeerReviewPage = () => {
  // 页面数据
  const [reviews, setReviews] = useState<ReviewAssignmentVO[]>([])
  const [completedReviews, setCompletedReviews] = useState<CompletedReview[]>([])
  const [points, setPoints] = useState<PointsVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  // 评价弹窗状态
  const [reviewing, setReviewing] = useState<ReviewAssignmentVO | null>(null)
  const [score, setScore] = useState(60)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Toast 状态
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({
    visible: false, type: 'success', message: '',
  })

  // 录音统计缓存
  const [recordingStats, setRecordingStats] = useState<Map<number, ReviewStatsVO>>(new Map())

  /** 显示 Toast，2 秒后自动消失 */
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000)
  }

  /** 加载数据 */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingReviews, pointsData] = await Promise.all([
        getPendingReviews().catch(() => [] as ReviewAssignmentVO[]),
        getPoints().catch(() => null),
      ])
      setReviews(pendingReviews || [])
      setPoints(pointsData)
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /** 打开评价弹窗 */
  const openReview = async (item: ReviewAssignmentVO) => {
    setReviewing(item)
    setScore(60)
    setComment('')
    // 懒加载录音统计
    if (!recordingStats.has(item.recordingId)) {
      try {
        const stats = await getRecordingStats(item.recordingId)
        setRecordingStats(prev => new Map(prev).set(item.recordingId, stats))
      } catch {
        // 统计加载失败不阻塞评价流程
      }
    }
  }

  /** 提交评价 */
  const handleSubmit = async () => {
    if (!reviewing) return
    if (comment.length > 200) {
      showToast('error', '评价内容不能超过 200 字')
      return
    }
    setSubmitting(true)
    try {
      await submitReview(reviewing.id, score, comment)
      // 将已提交的评价移入已完成列表
      const completed: CompletedReview = {
        id: reviewing.id,
        recordingId: reviewing.recordingId,
        sentencePreview: reviewing.sentencePreview,
        score,
        comment,
        submittedAt: new Date().toISOString(),
      }
      setCompletedReviews(prev => [completed, ...prev])
      setReviews(prev => prev.filter(r => r.id !== reviewing.id))
      setReviewing(null)
      showToast('success', `评价已提交 +3 积分`)
      // 刷新积分
      getPoints().then(setPoints).catch(() => {})
    } catch {
      showToast('error', '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  // ========== 加载态 ==========
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton variant="text" width={60} height={14} className="mb-2" />
              <Skeleton variant="text" width={40} height={24} />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton variant="text" width="80%" height={20} className="mb-3" />
              <Skeleton variant="text" width="50%" height={14} className="mb-2" />
              <Skeleton variant="text" width="30%" height={14} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ========== 空态 ==========
  if (reviews.length === 0 && completedReviews.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">匿名互评</h1>
        <EmptyState
          title="暂无待审阅的录音"
          description="当有其他学习者的录音需要评价时，会显示在这里。帮助他人，共同进步！"
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">匿名互评</h1>

      {/* 头部统计 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">待审阅</p>
          <p className="text-2xl font-bold text-blue-600">{reviews.length} 条</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">已完成互评</p>
          <p className="text-2xl font-bold text-green-600">{completedReviews.length} 条</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">获得积分</p>
          <p className="text-2xl font-bold text-yellow-600">{points?.totalPoints ?? 0}</p>
        </div>
      </div>

      {/* 待审阅列表 */}
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        待审阅（{reviews.length} 条）
      </h3>
      <div className="space-y-3 mb-6">
        {reviews.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-800 mb-1 line-clamp-2">
                  {item.sentencePreview}
                </p>
                <p className="text-xs text-gray-400">
                  来自{' '}
                  <span className="text-gray-500">
                    {'\u{1F464}'} 匿名用户
                  </span>
                  {' \u{00B7} '}
                  {formatTime(item.assignedAt)}
                </p>
              </div>
              <button
                onClick={() => openReview(item)}
                className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                去评价
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 已完成评价（折叠区域） */}
      {completedReviews.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={`inline-block transition-transform ${showCompleted ? 'rotate-90' : ''}`}>
              {'\u{25B6}'}
            </span>
            已完成评价（{completedReviews.length} 条）
          </button>
          {showCompleted && (
            <div className="mt-3 space-y-2">
              {completedReviews.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-4"
                >
                  <p className="text-sm text-gray-700 mb-1 line-clamp-2">{item.sentencePreview}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>评分：<span className="text-gray-600 font-medium">{item.score}</span></span>
                    {item.comment && (
                      <span className="line-clamp-1">评价："{item.comment}"</span>
                    )}
                    <span>{formatTime(item.submittedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== 评价弹窗 ========== */}
      {reviewing && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center px-4"
          onClick={() => !submitting && setReviewing(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">评价录音</h2>
              <button
                onClick={() => !submitting && setReviewing(null)}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none disabled:opacity-50"
              >
                &times;
              </button>
            </div>

            {/* 录音句子 */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-5">
              <p className="text-xs text-blue-500 mb-1">录音内容</p>
              <p className="text-base text-gray-800">{reviewing.sentencePreview}</p>
            </div>

            {/* AI 评分参考 */}
            {recordingStats.get(reviewing.recordingId) && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-5">
                <p className="text-xs text-gray-400 mb-1">AI 评分参考</p>
                <p className="text-sm text-gray-600">
                  AI 评分：<span className="font-medium">{recordingStats.get(reviewing.recordingId)!.aiScore} 分</span>
                  <span className="mx-2">|</span>
                  已有 <span className="font-medium">{recordingStats.get(reviewing.recordingId)!.reviewCount}</span> 人参与互评
                </p>
              </div>
            )}

            {/* 评分滑块 */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">评分</label>
                <span className="text-2xl font-bold text-blue-600">{score}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* 文字评价 */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                文字评价（选填）
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="分享你的评价，帮助学习者改进…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/200</p>
            </div>

            {/* 提交按钮 */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '提交中…' : '提交评价'}
            </button>

            <button
              onClick={() => !submitting && setReviewing(null)}
              disabled={submitting}
              className="mt-3 w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium
                         hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </div>
  )
}

export default PeerReviewPage
