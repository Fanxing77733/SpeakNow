/**
 * 管理后台布局 — 侧边栏 + 内容区
 *
 * Claymorphism 风格：柔和 3D 侧边栏 + 玻璃态内容区
 */
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

/* ---- SVG 图标 ---- */
const IconBack = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)
const IconBook = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)
const IconPencilSquare = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const IconChartBar = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const IconUsers = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const IconDashboard = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

interface SideLinkDef {
  to: string
  label: string
  icon: React.ReactNode
}

const teacherLinks: SideLinkDef[] = [
  { to: '/admin/teacher/classes', label: '班级管理', icon: <IconBook /> },
  { to: '/admin/teacher/assignments', label: '作业管理', icon: <IconPencilSquare /> },
  { to: '/admin/teacher/reports', label: '学习报告', icon: <IconChartBar /> },
]

const operatorLinks: SideLinkDef[] = [
  { to: '/admin/operator/users', label: '用户管理', icon: <IconUsers /> },
  { to: '/admin/operator/reviews', label: '内容审核', icon: <IconSearch /> },
  { to: '/admin/operator/dashboard', label: '数据看板', icon: <IconDashboard /> },
]

const SideLink = ({ to, label, icon }: SideLinkDef) => {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-teal-50 text-teal-700 shadow-sm'
          : 'text-teal-700/60 hover:text-teal-700 hover:bg-teal-50/50'
      }`}
      style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
    >
      <span className={isActive ? 'text-teal-600' : 'text-teal-700/40'}>{icon}</span>
      {label}
    </NavLink>
  )
}

const AdminLayout = () => {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const role = user?.role || ''
  const isTeacher = role === 'TEACHER' || role === 'ADMIN'
  const isOperator = role === 'OPERATOR' || role === 'ADMIN'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 100%)' }}>
      {/* 侧边栏 */}
      <aside className="w-60 bg-white/80 backdrop-blur-xl border-r border-teal-100/50 flex flex-col shrink-0 shadow-xl shadow-teal-900/5">
        {/* Logo 区 */}
        <div className="px-5 py-5 border-b border-teal-100/30">
          <h1 className="text-base font-extrabold text-teal-700 tracking-tight"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            管理后台
          </h1>
          <p className="text-xs text-teal-600/40 mt-0.5 truncate font-medium">
            {user?.nickname || user?.email || ''}
          </p>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-auto">
          {isTeacher && (
            <div>
              <p className="px-3 pb-2 text-xs font-semibold text-teal-800/40 uppercase tracking-wider"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                教师端
              </p>
              <div className="space-y-0.5">
                {teacherLinks.map((link) => (
                  <SideLink key={link.to} {...link} />
                ))}
              </div>
            </div>
          )}
          {isOperator && (
            <div>
              <p className="px-3 pb-2 text-xs font-semibold text-teal-800/40 uppercase tracking-wider"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                运营端
              </p>
              <div className="space-y-0.5">
                {operatorLinks.map((link) => (
                  <SideLink key={link.to} {...link} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* 底部操作 */}
        <div className="px-4 py-4 border-t border-teal-100/30 space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-teal-600/60 hover:text-teal-700 hover:bg-teal-50/50 transition-all duration-200"
          >
            <IconBack />
            返回学习页面
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>
      </aside>

      {/* 内容区 */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
