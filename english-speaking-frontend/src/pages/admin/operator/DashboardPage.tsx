/**
 * 数据看板页 — 核心运营指标
 */
import { useState, useEffect, useCallback } from 'react'
import { getDashboardOverview, getDashboardUsers } from '../../../api/admin'

export default function DashboardPage() {
  const [overview, setOverview] = useState<Record<string, any>>({})
  const [userStats, setUserStats] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, us] = await Promise.all([
        getDashboardOverview(),
        getDashboardUsers(),
      ])
      setOverview(ov)
      setUserStats(us)
    } catch { /* handled */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-gray-400">加载中...</p>

  const roleDist = userStats.roleDistribution || {}

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">运营数据看板</h2>

      <h3 className="text-sm font-semibold text-gray-500 mb-2">核心指标</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card label="总用户" value={overview.totalUsers} />
        <Card label="今日新增" value={overview.todayNewUsers} />
        <Card label="日活 (DAU)" value={overview.dau} />
        <Card label="月活 (MAU)" value={overview.mau} />
        <Card label="待审核" value={overview.pendingReviews} highlight />
        <Card label="今日审核" value={overview.todayReviewed} />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 mb-2">内容数据</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card label="总练习数" value={userStats.totalPractices} />
        <Card label="总对话数" value={userStats.totalConversations} />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 mb-2">角色分布</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(roleDist).map(([role, count]) => (
          <Card key={role} label={role} value={count as number} />
        ))}
      </div>
    </div>
  )
}

const Card = ({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) => (
  <div className={`rounded-lg border p-4 text-center ${highlight ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
      {value != null ? value : '-'}
    </p>
  </div>
)
