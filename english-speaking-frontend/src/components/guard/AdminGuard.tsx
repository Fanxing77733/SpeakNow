/**
 * 管理后台路由守卫
 *
 * 检查用户角色：
 * - LEARNER → 重定向到首页
 * - TEACHER/OPERATOR/ADMIN → 渲染子路由
 * - 未加载用户信息 → 先 fetchProfile 再判断
 */
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const ADMIN_ROLES = ['TEACHER', 'OPERATOR', 'ADMIN']

const AdminGuard = () => {
  const user = useAuthStore((s) => s.user)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (token && !user) {
      fetchProfile()
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    }
  }, [token, user, fetchProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  if (!user || !ADMIN_ROLES.includes(user.role || '')) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminGuard
