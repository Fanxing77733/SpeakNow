/**
 * 学习进度页
 *
 * 展示用户的学习数据概览：
 * - 三张数字卡片：总练习次数 / 总学习时长 / 历史最高分
 * - 数字渐增动画（0 → 目标值，0.8s）
 * - 加载态：骨架屏 / 错误态：重试按钮 / 空状态：引导去练习
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '../../stores/progressStore'
import { useCountUp } from '../../hooks/useCountUp'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

/** 统计卡片组件 */
interface StatCardProps {
  icon: string
  title: string
  value: string | number
  label: string
}

const StatCard = ({ icon, title, value, label }: StatCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
        {icon}
      </div>
      <span className="text-sm text-gray-500">{title}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-4xl font-bold text-gray-900 tabular-nums">
        {value}
      </span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  </div>
)

const ProgressPage = () => {
  const navigate = useNavigate()
  const { summary, isLoading, error, fetchSummary } = useProgressStore()

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // 数字渐增动画（仅数字类型使用）
  const animatedPractices = useCountUp(summary?.summary?.totalPractices ?? 0, 800, !isLoading && !summary?.empty)
  const animatedScore = useCountUp(summary?.summary?.highestScore ?? 0, 800, !isLoading && !summary?.empty)

  // ========== 加载态：骨架屏 ==========
  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width={80} height={16} />
              </div>
              <Skeleton variant="text" width="60%" height={36} className="mb-2" />
              <Skeleton variant="text" width="30%" height={14} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ========== 错误态 ==========
  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchSummary}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // ========== 空状态（新用户无数据） ==========
  if (summary?.empty || !summary?.summary) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>
        <EmptyState
          title="暂无学习数据"
          description="开始你的第一次练习吧！"
          actionLabel="去练习"
          onAction={() => navigate('/practice')}
        />
      </div>
    )
  }

  // ========== 数据展示 ==========
  const data = summary.summary

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon="📝"
          title="总练习次数"
          value={animatedPractices}
          label="次练习"
        />
        <StatCard
          icon="⏱"
          title="总学习时长"
          value={data.totalDurationFormatted}
          label="总时长"
        />
        <StatCard
          icon="🏆"
          title="历史最高分"
          value={animatedScore}
          label="分"
        />
      </div>
    </div>
  )
}

export default ProgressPage
