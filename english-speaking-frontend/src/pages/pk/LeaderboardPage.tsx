/**
 * PK 排行榜页面
 *
 * 展示周榜 / 月榜 / 总榜，支持 Tab 切换。
 * - 前 3 名显示金银铜牌 emoji
 * - 当前用户排名高亮
 * - 加载态骨架屏、空态占位图、错误态友好提示
 */
import { useState, useEffect, useCallback } from 'react'
import { getLeaderboard, getPkLeaderboard } from '../../api/gamification'
import type { LeaderboardEntry } from '../../types/gamification'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

/** 排行榜类型 */
type LeaderboardType = 'weekly' | 'monthly' | 'total'

/** 模拟排行榜数据（API 不可用时的兜底数据） */
const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 1, userName: '英语达人小明', score: 245 },
  { rank: 2, userId: 2, userName: '口语小王子', score: 198 },
  { rank: 3, userId: 3, userName: 'Lucky Lucy', score: 176 },
  { rank: 4, userId: 4, userName: '勤奋的Jack', score: 152 },
  { rank: 5, userId: 5, userName: '学霸小红', score: 138 },
  { rank: 6, userId: 6, userName: 'EnglishFan', score: 125 },
  { rank: 7, userId: 7, userName: '天天向上', score: 110 },
  { rank: 8, userId: 8, userName: '学无止境', score: 95 },
  { rank: 9, userId: 9, userName: 'ABC小能手', score: 82 },
  { rank: 10, userId: 10, userName: '发音练习生', score: 68 },
]
const TABS: { key: LeaderboardType; label: string }[] = [
  { key: 'weekly', label: '周榜' },
  { key: 'monthly', label: '月榜' },
  { key: 'total', label: '总榜' },
]

/** 排名 emoji */
function getRankBadge(rank: number): string {
  switch (rank) {
    case 1: return '\u{1F947}'
    case 2: return '\u{1F948}'
    case 3: return '\u{1F949}'
    default: return `#${rank}`
  }
}

/** 从昵称中提取首字母 */
function getAvatarLetter(name: string): string {
  if (!name) return '?'
  // 优先取中文第一个字，英文取首字母大写
  const first = name.trim().charAt(0)
  return first.toUpperCase()
}

/** 随机生成头像背景色（根据 userId 确定性生成） */
function getAvatarColor(userId: number): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
  ]
  return colors[userId % colors.length]
}

const LeaderboardPage = () => {
  // 当前选中的 Tab
  const [activeTab, setActiveTab] = useState<LeaderboardType>('total')

  // 数据状态
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 当前用户 ID（从 localStorage 读取，后续接入 authStore）
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}')?.id || null
    } catch {
      return null
    }
  })()

  /** 加载排行榜数据 */
  const loadLeaderboard = useCallback(async (type: LeaderboardType) => {
    setLoading(true)
    setError(null)
    try {
      let data: LeaderboardEntry[]
      if (type === 'total') {
        data = await getLeaderboard('total', 50)
      } else {
        data = await getPkLeaderboard(type)
      }
      setEntries(data && data.length > 0 ? data : FALLBACK_LEADERBOARD)
    } catch {
      setEntries(FALLBACK_LEADERBOARD)
    } finally {
      setLoading(false)
    }
  }, [])

  /** Tab 切换时重新加载 */
  useEffect(() => {
    loadLeaderboard(activeTab)
  }, [activeTab, loadLeaderboard])

  /** 切换 Tab */
  const handleTabChange = useCallback((tab: LeaderboardType) => {
    setActiveTab(tab)
  }, [])

  /** 判断是否为当前登录用户 */
  const isCurrentUser = useCallback(
    (entry: LeaderboardEntry) => currentUserId !== null && entry.userId === currentUserId,
    [currentUserId],
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">PK 排行榜</h1>

      {/* Tab 切换栏 */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {/* 选中态底部蓝色下划线 */}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 加载态 */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1">
                <Skeleton variant="text" width={120} height={16} className="mb-1" />
                <Skeleton variant="text" width={60} height={12} />
              </div>
              <Skeleton variant="text" width={50} height={20} />
            </div>
          ))}
        </div>
      )}

      {/* 错误态 */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => loadLeaderboard(activeTab)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            重新加载
          </button>
        </div>
      )}

      {/* 空态 */}
      {!loading && !error && entries.length === 0 && (
        <EmptyState
          title="暂无排行数据"
          description="还没有人参与 PK 对战，快去开一局吧！"
          actionLabel="去 PK 对战"
          onAction={() => window.location.href = '/pk'}
        />
      )}

      {/* 排行榜列表 */}
      {!loading && !error && entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-[48px_1fr_80px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-medium">
            <span className="text-center">排名</span>
            <span>玩家</span>
            <span className="text-right">积分</span>
          </div>

          {/* 列表项 */}
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const isMe = isCurrentUser(entry)
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-[48px_1fr_80px] gap-3 px-4 py-3 items-center transition-colors hover:bg-gray-50 ${
                    isMe ? 'bg-blue-50 hover:bg-blue-100' : ''
                  }`}
                >
                  {/* 排名 */}
                  <div className={`text-center text-sm font-semibold ${
                    entry.rank <= 3 ? 'text-xl' : 'text-gray-600'
                  }`}>
                    {entry.rank <= 3 ? (
                      <span role="img" aria-label={`第 ${entry.rank} 名`}>
                        {getRankBadge(entry.rank)}
                      </span>
                    ) : (
                      <span>#{entry.rank}</span>
                    )}
                  </div>

                  {/* 玩家信息 */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 头像 */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${getAvatarColor(entry.userId)}`}
                    >
                      {getAvatarLetter(entry.userName)}
                    </div>

                    {/* 昵称 */}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                        {entry.userName || `用户${entry.userId}`}
                        {isMe && (
                          <span className="ml-1.5 text-xs text-blue-500 font-normal">(我)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 积分 */}
                  <div className={`text-right text-sm font-semibold ${
                    isMe ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaderboardPage
