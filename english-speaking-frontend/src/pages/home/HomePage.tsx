/**
 * 首页 — 用户登录后的主页
 *
 * 包含：渐变欢迎横幅、学习概览卡片、功能入口网格
 */
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useProgressStore } from '../../stores/progressStore'
import { useCountUp } from '../../hooks/useCountUp'
import Skeleton from '../../components/ui/Skeleton'

/* ---- SVG 图标组件 ---- */

const IconMic = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
)

const IconChat = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const IconClipboard = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const IconChart = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const IconTheater = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-4a2 2 0 012-2h2v-2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2v2h2a2 2 0 012 2v4a2 2 0 01-2 2h-4v-2M7 7h.01" />
  </svg>
)

const IconPencil = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const IconMap = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
)

const IconTrophy = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14M8 3v2.5M16 3v2.5M9 15l-1 6h8l-1-6M8 8h8a3 3 0 013 3v1a3 3 0 01-3 3H8a3 3 0 01-3-3v-1a3 3 0 013-3z" />
  </svg>
)

const IconSchool = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M5 10v11m4-11v11m6-11v11m4-11v11" />
  </svg>
)

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

/* ---- 数据 ---- */

interface QuickEntry {
  icon: React.ReactNode
  title: string
  desc: string
  path: string
  color: string
  bgColor: string
}

const quickEntries: QuickEntry[] = [
  { icon: <IconMic />, title: '发音评测', desc: 'AI 实时发音纠正反馈', path: '/practice', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { icon: <IconChat />, title: '情景对话', desc: '46 个场景自由对话', path: '/conversation', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { icon: <IconClipboard />, title: '英语测评', desc: '30题随机 CEFR 六级定级', path: '/assessment', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { icon: <IconChart />, title: '学习进度', desc: '雷达图多维度分析', path: '/progress', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { icon: <IconTheater />, title: '角色扮演', desc: '沉浸式情景角色对话', path: '/roleplay', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { icon: <IconPencil />, title: '语法纠错', desc: 'AI 语法检查与错题本', path: '/grammar', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { icon: <IconMap />, title: '学习路径', desc: '个性化阶段学习路线', path: '/learning', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { icon: <IconTrophy />, title: '闯关学习', desc: '游戏化闯关与勋章', path: '/gamification', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { icon: <IconSchool />, title: '我的班级', desc: '加入班级完成老师作业', path: '/my-classes', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  { icon: <IconUsers />, title: '学习社区', desc: '小组互助与语音挑战', path: '/community', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
]

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { summary, isLoading, fetchSummary } = useProgressStore()

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const dateStr = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${year}年${month}月${day}日 ${weekDays[now.getDay()]}`
  }, [])

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

  return (
    <div className="animate-fade-in-up">
      {/* ========== 欢迎横幅 ========== */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 35%, #2DD4BF 65%, #0D9488 100%)' }}>
        {/* 装饰光斑 */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              你好，{user?.nickname ?? '同学'}
            </h1>
            <p className="mt-1.5 text-teal-50/90 text-sm font-medium">
              {dateStr} · 今天也要坚持练习哦
            </p>
          </div>
          <button
            onClick={() => navigate('/practice')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm hover:bg-white/30 transition-all duration-200 active:scale-95"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
          >
            <IconMic />
            开始练习
          </button>
        </div>
      </div>

      {/* ========== 学习概览区 ========== */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-teal-800/60 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          学习概览
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="clay-card p-5">
                <Skeleton variant="circular" width={36} height={36} className="mb-3" />
                <Skeleton variant="text" width="50%" height={28} className="mb-1" />
                <Skeleton variant="text" width="30%" height={14} />
              </div>
            ))}
          </div>
        ) : summary?.empty || !summary?.summary ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/practice')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/practice') }}
            className="clay-card p-6 text-center cursor-pointer group"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 text-teal-500 mb-3 group-hover:scale-110 transition-transform duration-300">
              <IconMic />
            </div>
            <p className="text-sm font-semibold text-teal-800">完成第一次练习，解锁学习数据</p>
            <p className="text-xs text-teal-500 mt-1.5 group-hover:text-teal-600 transition-colors">前往练习 →</p>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/progress')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/progress') }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 cursor-pointer"
          >
            {/* 总练习 */}
            <div className="clay-card p-5 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform duration-300">
                  <IconMic />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-teal-900 tabular-nums"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                {animatedPractices}
              </p>
              <p className="text-sm text-teal-600/60 font-medium mt-1">总练习</p>
            </div>

            {/* 总时长 */}
            <div className="clay-card p-5 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-extrabold text-teal-900 tabular-nums"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                {summary.summary.totalDurationFormatted}
              </p>
              <p className="text-sm text-teal-600/60 font-medium mt-1">总时长</p>
            </div>

            {/* 最高分 */}
            <div className="clay-card p-5 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                  <IconTrophy />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-teal-900 tabular-nums"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                {animatedScore}
              </p>
              <p className="text-sm text-teal-600/60 font-medium mt-1">最高分</p>
            </div>
          </div>
        )}
      </div>

      {/* ========== 快捷入口区 ========== */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-teal-800/60 uppercase tracking-wider mb-4"
          style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          快捷入口
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {quickEntries.map((entry) => (
            <div
              key={entry.path}
              role="button"
              tabIndex={0}
              onClick={() => navigate(entry.path)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(entry.path) }}
              className="clay-card p-5 cursor-pointer group"
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${entry.bgColor} ${entry.color} group-hover:scale-110 transition-transform duration-300 mb-3`}>
                {entry.icon}
              </div>
              <h3 className="text-sm font-semibold text-teal-900 mb-1"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                {entry.title}
              </h3>
              <p className="text-xs text-teal-600/50 leading-relaxed">{entry.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========== 底部装饰线 ========== */}
      <div className="text-center pb-4">
        <div className="inline-block h-1 w-12 rounded-full bg-gradient-to-r from-teal-400 to-teal-600" />
      </div>
    </div>
  )
}

export default HomePage
