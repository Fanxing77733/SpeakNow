/**
 * 顶部导航栏 — 浮动玻璃拟态
 *
 * 桌面端水平导航 + 移动端汉堡菜单
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface NavItem {
  label: string
  path: string
}

const mainNav: NavItem[] = [
  { label: '发音评测', path: '/practice' },
  { label: '场景对话', path: '/conversation' },
  { label: '话题陈述', path: '/speech' },
  { label: '闯关学习', path: '/gamification' },
  { label: '单词PK', path: '/pk' },
  { label: '我的班级', path: '/my-classes' },
  { label: '客服', path: '/support' },
]

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileOpen(false)
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <header className="sticky top-3 z-50 px-4">
      <div className="max-w-6xl mx-auto glass-surface rounded-2xl px-5 h-14 flex items-center justify-between shadow-lg shadow-teal-900/5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-xl font-extrabold text-teal-600 tracking-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            SpeakingNow
          </span>
        </Link>

        {/* 桌面端导航 */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-teal-700/70 hover:text-teal-700 hover:bg-teal-50/50'
                }`}
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
              >
                {item.label}
              </Link>
            ))}

            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <Link
                to="/admin/teacher/classes"
                className="ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-all duration-200"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
              >
                教师后台
              </Link>
            )}
            {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
              <Link
                to="/admin/operator/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-all duration-200"
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
              >
                运营后台
              </Link>
            )}
          </nav>
        )}

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-teal-700/70 hover:text-teal-700 hover:bg-teal-50/50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="max-w-[80px] truncate">{user?.nickname ?? '个人中心'}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-medium text-teal-700/50 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                退出
              </button>

              {/* 移动端汉堡按钮 */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors"
                aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="clay-btn text-sm px-5 py-1.5"
            >
              登录
            </Link>
          )}
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden mt-2 glass-surface rounded-2xl p-4 shadow-xl animate-fade-in-up">
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-teal-700/70 hover:bg-teal-50/50'
                }`}
                style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-teal-200/50" />
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-teal-700/70 hover:bg-teal-50/50"
            >
              个人中心
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left"
            >
              退出登录
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
