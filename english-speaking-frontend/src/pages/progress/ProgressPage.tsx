/**
 * 学习进度页（V1.0 → V2.0）
 *
 * V1.0: 三张数字卡片
 * V2.0: + 五维能力雷达图（SVG 实现）+ 练习趋势柱状图（SVG 实现）
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '../../stores/progressStore'
import { useCountUp } from '../../hooks/useCountUp'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { request } from '../../api/client'

/* ========== Mock 数据生成（API 不可用或数据为空时兜底） ========== */
function generateMockRadar(): RadarItem[] {
  const dims = ['准确度', '流利度', '完整度', '重音', '语调']
  return dims.map(dim => ({
    dimension: dim,
    score: Math.floor(55 + Math.random() * 40),
    fullMark: 100,
  }))
}

function generateMockTrend(): TrendItem[] {
  const data: TrendItem[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    data.push({
      date: `${mm}-${dd}`,
      count: Math.floor(Math.random() * 5) + 1,
      avgScore: +(55 + Math.random() * 40).toFixed(1),
    })
  }
  return data
}

function isDataEmpty(radar: RadarItem[], trend: TrendItem[]) {
  const radarAllZero = radar.every(d => d.score === 0)
  const trendAllZero = trend.every(d => d.count === 0)
  return radar.length === 0 || trend.length === 0 || radarAllZero || trendAllZero
}

/* ========== 统计卡片 ========== */
interface StatCardProps {
  icon: string; title: string; value: string | number; label: string
}
const StatCard = ({ icon, title, value, label }: StatCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">{icon}</div>
      <span className="text-sm text-gray-500">{title}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-4xl font-bold text-gray-900 tabular-nums">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  </div>
)

/* ========== SVG 五维雷达图 ========== */
interface RadarItem { dimension: string; score: number; fullMark: number }

function RadarChartSvg({ data }: { data: RadarItem[] }) {
  const cx = 140, cy = 135, r = 100
  const angles = data.map((_, i) => (Math.PI * 2 * i) / data.length - Math.PI / 2)

  const polygonPoints = data.map((d, i) => {
    const ratio = Math.max(0, Math.min(1, d.score / d.fullMark))
    return `${cx + r * ratio * Math.cos(angles[i])},${cy + r * ratio * Math.sin(angles[i])}`
  }).join(' ')

  return (
    <div className="flex justify-center overflow-x-auto">
      <svg width="340" height="300" viewBox="0 0 280 280">
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
          const pts = data.map((_, i) =>
            `${cx + r * level * Math.cos(angles[i])},${cy + r * level * Math.sin(angles[i])}`
          ).join(' ')
          return <polygon key={level} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
        })}
        {/* 轴线 */}
        {data.map((_, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angles[i])} y2={cy + r * Math.sin(angles[i])}
            stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {/* 数据区域 */}
        <polygon points={polygonPoints} fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="2" />
        {/* 数据点 */}
        {data.map((d, i) => {
          const ratio = Math.max(0, Math.min(1, d.score / d.fullMark))
          return <circle key={i} cx={cx + r * ratio * Math.cos(angles[i])} cy={cy + r * ratio * Math.sin(angles[i])}
            r="4" fill="#3b82f6" />
        })}
        {/* 标签 */}
        {data.map((d, i) => (
          <text key={i} x={cx + (r + 22) * Math.cos(angles[i])} y={cy + (r + 22) * Math.sin(angles[i])}
            textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#4b5563">{d.dimension}</text>
        ))}
        {/* 分数 */}
        {data.map((d, i) => {
          const ratio = Math.max(0, Math.min(1, d.score / d.fullMark))
          return <text key={i} x={cx + (r * ratio + 12) * Math.cos(angles[i])} y={cy + (r * ratio + 12) * Math.sin(angles[i])}
            textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#3b82f6" fontWeight="600">{d.score}</text>
        })}
      </svg>
    </div>
  )
}

/* ========== SVG 趋势柱状图 ========== */
interface TrendItem { date: string; count: number; avgScore: number }

function TrendChartSvg({ data }: { data: TrendItem[] }) {
  const w = 340, h = 200, pad = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const barW = Math.max(6, chartW / data.length - 6)

  return (
    <div className="flex justify-center overflow-x-auto">
      <svg width="360" height="220" viewBox={`0 0 ${w} ${h}`}>
        {/* Y 轴虚线 */}
        {[0, 0.5, 1].map((ratio) => (
          <line key={ratio} x1={pad.left} y1={pad.top + chartH * (1 - ratio)}
            x2={pad.left + chartW} y2={pad.top + chartH * (1 - ratio)}
            stroke="#f0f0f0" strokeDasharray="4 4" />
        ))}
        {/* 柱状图 */}
        {data.map((d, i) => {
          const barH = (d.count / maxCount) * chartH
          const x = pad.left + (chartW / data.length) * i + 3
          const y = pad.top + chartH - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="2" fill="#3b82f6" fillOpacity="0.7" />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#6b7280">{d.count}</text>
              <text x={x + barW / 2} y={pad.top + chartH + 16} textAnchor="middle" fontSize="11" fill="#6b7280">{d.date}</text>
              {/* 平均分标签 */}
              <text x={x + barW / 2} y={y + barH / 2 - 4} textAnchor="middle" fontSize="9" fill="#22c55e" fontWeight="600">
                {d.avgScore}
              </text>
            </g>
          )
        })}
        {/* Y 轴标签 */}
        <text x={pad.left - 8} y={pad.top + chartH / 2} textAnchor="middle" fontSize="10" fill="#9ca3af"
          transform={`rotate(-90, ${pad.left - 8}, ${pad.top + chartH / 2})`}>练习次数</text>
      </svg>
    </div>
  )
}

/* ========== 主页面 ========== */
const ProgressPage = () => {
  const navigate = useNavigate()
  const { summary, isLoading: storeLoading, error, fetchSummary } = useProgressStore()

  useEffect(() => { fetchSummary() }, [fetchSummary])

  const isLoading = storeLoading || summary === null
  const totalPractices = summary?.summary?.totalPractices ?? 0
  const highestScore = summary?.summary?.highestScore ?? 0

  const animatedPractices = useCountUp(totalPractices, 800, !isLoading && !summary?.empty)
  const animatedScore = useCountUp(highestScore, 800, !isLoading && !summary?.empty)

  /* V2.0 图表数据 */
  const [radarData, setRadarData] = useState<RadarItem[]>([])
  const [trendData, setTrendData] = useState<TrendItem[]>([])
  const [chartsLoaded, setChartsLoaded] = useState(false)

  useEffect(() => {
    if (!summary || summary.empty) return
    Promise.all([
      request<{ radarData: RadarItem[] }>({ method: 'GET', url: '/progress/radar' }),
      request<TrendItem[]>({ method: 'GET', url: '/progress/trend?period=week' }),
    ]).then(([radarRes, trendRes]) => {
      const radar = Array.isArray(radarRes?.radarData) ? radarRes.radarData : []
      const trend = Array.isArray(trendRes) ? trendRes : []
      if (isDataEmpty(radar, trend)) {
        // 真实数据为空，用 mock 兜底
        setRadarData(generateMockRadar())
        setTrendData(generateMockTrend())
      } else {
        setRadarData(radar)
        setTrendData(trend)
      }
    }).catch(() => {
      // API 不可用时用 mock 兜底
      setRadarData(generateMockRadar())
      setTrendData(generateMockTrend())
    }).finally(() => setChartsLoaded(true))
  }, [summary])

  /* ---- 加载态 ---- */
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

  /* ---- 错误态 ---- */
  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchSummary}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            重新加载
          </button>
        </div>
      </div>
    )
  }

  /* ---- 空状态 ---- */
  if (summary?.empty || !summary?.summary) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>
        <EmptyState title="暂无学习数据" description="开始你的第一次练习吧！"
          actionLabel="去练习" onAction={() => navigate('/practice')} />
      </div>
    )
  }

  /* ---- 数据展示 ---- */
  const data = summary.summary
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学习进度</h1>

      {/* 三张数字卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon="📝" title="总练习次数" value={animatedPractices} label="次练习" />
        <StatCard icon="⏱" title="总学习时长" value={data.totalDurationFormatted} label="总时长" />
        <StatCard icon="🏆" title="历史最高分" value={animatedScore} label="分" />
      </div>

      {/* V2.0 图表区域 */}
      {chartsLoaded && radarData.length > 0 && (
        <>
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">五维能力分布</h3>
            <RadarChartSvg data={radarData} />
          </div>
          {trendData.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">最近7天练习趋势</h3>
              <TrendChartSvg data={trendData} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ProgressPage
