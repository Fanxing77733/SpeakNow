/**
 * 顶部导航栏
 *
 * 响应式：移动端汉堡菜单，桌面端水平导航。
 *
 * TODO: Step 2 实现 — 完整导航菜单、用户头像下拉、响应式汉堡菜单
 */
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-lg font-bold text-blue-600">
          AI 英语口语
        </Link>

        {/* 桌面端导航 */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/practice" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              发音评测
            </Link>
            <Link to="/conversation" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              场景对话
            </Link>
            <Link to="/speech" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              话题陈述
            </Link>
            <Link to="/gamification" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              闯关学习
            </Link>
            <Link to="/pk" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              单词PK
            </Link>
            <Link to="/support" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              客服
            </Link>
            {user?.role === 'TEACHER' || user?.role === 'ADMIN' ? (
              <Link to="/admin/teacher/classes" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                教师后台
              </Link>
            ) : null}
            {user?.role === 'OPERATOR' || user?.role === 'ADMIN' ? (
              <Link to="/admin/operator/dashboard" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                运营后台
              </Link>
            ) : null}
          </nav>
        )}

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {user?.nickname ?? '个人中心'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                退出
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
