/**
 * 首页
 *
 * 用户登录后的主页面，包含：
 * - 顶部欢迎区（昵称 + 日期）
 * - 学习概览区（缩小版三卡片，点击跳转进度页）
 * - 快捷入口区（2x2 网格：发音评测/情景对话/英语测评/学习进度）
 * - 底部退出登录按钮
 */
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProgressStore } from '../../stores/progressStore'
import { useCountUp } from '../../hooks/useCountUp'
import Skeleton from '../../components/ui/Skeleton'

/** 快捷入口卡片 */
interface QuickEntryProps {
  icon: string
  title: string
  desc: string
  path: string
}

const QuickEntryCard = ({ icon, title, desc, path }: QuickEntryProps) => {
  const navigate = useNavigate()
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(path)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(path) }}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <h3 className="text-sm font-medium text-gray-900 mt-2">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </div>
  )
}

/** 概览数值卡片 */
interface OverviewValueProps {
  icon: string
  value: string | number
  label: string
}

const OverviewValue = ({ icon, value, label }: OverviewValueProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <span className="text-lg" aria-hidden="true">{icon}</span>
    <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
)

const HomePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { summary, isLoading, fetchSummary } = useProgressStore()

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // 格式化日期：2026年6月27日 星期六
  const dateStr = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekDay = weekDays[now.getDay()]
    return `${year}年${month}月${day}日 ${weekDay}`
  }, [])

  // 数字渐增动画
  const animatedPractices = useCountUp(
    summary?.summary?.totalPractices ?? 0,
    800,
    !isLoading && !summary?.empty && !!summary?.summary,
  )
  const animatedScore = useCountUp(
    summary?.summary?.highestScore ?? 0,
    800,
    !isLoading && !summary?.empty && !!summary?.summary,
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 快捷入口配置
  const quickEntries: QuickEntryProps[] = [
    {
      icon: '🎤',
      title: '发音评测',
      desc: '练习发音，获得实时反馈',
      path: '/practice',
    },
    {
      icon: '💬',
      title: '情景对话',
      desc: '选择场景，与AI对话练习',
      path: '/conversation',
    },
    {
      icon: '📋',
      title: '英语测评',
      desc: '测试你的英语水平',
      path: '/assessment',
    },
    {
      icon: '📊',
      title: '学习进度',
      desc: '查看你的学习数据',
      path: '/progress',
    },
  ]

  return (
    <div>
      {/* ========== 欢迎区 ========== */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          你好，{user?.nickname ?? '同学'}，欢迎回来！
        </h1>
        <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
      </div>

      {/* ========== 学习概览区 ========== */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">学习概览</h2>

        {isLoading ? (
          /* 加载态：3 列骨架屏 */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <Skeleton variant="circular" width={32} height={32} className="mb-2" />
                <Skeleton variant="text" width="60%" height={28} className="mb-1" />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
            ))}
          </div>
        ) : summary?.empty || !summary?.summary ? (
          /* 空状态：引导文案，点击跳转练习 */
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/practice')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/practice') }}
            className="bg-white rounded-xl border border-dashed border-gray-300 p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <p className="text-sm text-gray-500">
              完成第一次练习，解锁学习数据
            </p>
            <p className="text-xs text-blue-600 mt-1">前往练习 →</p>
          </div>
        ) : (
          /* 数据展示：3 列缩略卡片，整体点击跳转进度页 */
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/progress')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/progress') }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl"
          >
            <OverviewValue
              icon="📝"
              value={animatedPractices}
              label="总练习"
            />
            <OverviewValue
              icon="⏱"
              value={summary.summary.totalDurationFormatted}
              label="总时长"
            />
            <OverviewValue
              icon="🏆"
              value={animatedScore}
              label="最高分"
            />
          </div>
        )}
      </div>

      {/* ========== 快捷入口区 ========== */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-3">快捷入口</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickEntries.map((entry) => (
            <QuickEntryCard key={entry.path} {...entry} />
          ))}
        </div>
      </div>

      {/* ========== 退出登录 ========== */}
      <div className="text-center pb-4">
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

export default HomePage
