/**
 * 路由守卫
 *
 * 检查认证状态：
 * - 未认证 → 重定向到 /login，保留回跳路径
 * - 已认证 → 渲染子路由（Outlet）
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const AuthGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default AuthGuard
