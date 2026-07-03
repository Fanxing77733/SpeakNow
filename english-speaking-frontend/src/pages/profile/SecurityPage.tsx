/**
 * 账号安全中心页面
 *
 * 功能：
 * - 修改密码（需验证原密码）
 * - 设备管理（查看活跃会话 + 远程踢出）
 * - 账号注销（二次确认 + 7天冷静期提示）
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  changePassword,
  getSessions,
  kickSession,
  deactivateAccount,
  type SessionInfo,
} from '../../api/security'
import Toast from '../../components/ui/Toast'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function SecurityPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  // 修改密码
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changing, setChanging] = useState(false)

  // 设备管理
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // 注销
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
  }, [])

  // 加载设备列表
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const data = await getSessions()
      setSessions(data)
    } catch {
      showToast('加载设备列表失败', 'error')
    } finally {
      setLoadingSessions(false)
    }
  }, [showToast])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // 修改密码
  const handleChangePassword = async () => {
    if (!oldPassword) {
      showToast('请输入原密码', 'error')
      return
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
      showToast('密码需8-20位，包含字母和数字', 'error')
      return
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      showToast('密码需包含字母和数字', 'error')
      return
    }
    setChanging(true)
    try {
      await changePassword({ oldPassword, newPassword })
      showToast('密码修改成功，请重新登录')
      setOldPassword('')
      setNewPassword('')
      setTimeout(() => logout(), 1500)
    } catch (e: any) {
      showToast(e?.message || '修改失败，请重试', 'error')
    } finally {
      setChanging(false)
    }
  }

  // 踢出设备
  const handleKickSession = async (sessionId: string) => {
    try {
      await kickSession(sessionId)
      showToast('设备已踢出')
      loadSessions()
    } catch {
      showToast('操作失败，请重试', 'error')
    }
  }

  // 申请注销
  const handleDeactivate = async () => {
    try {
      const msg = await deactivateAccount()
      showToast(msg)
      setShowDeactivateConfirm(false)
    } catch (e: any) {
      showToast(e?.message || '操作失败，请重试', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="text-gray-500 text-lg">
          ←
        </button>
        <h1 className="text-lg font-semibold text-gray-900">账号安全</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* 修改密码 */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">修改密码</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">原密码</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入原密码"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8-20位，包含字母和数字"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changing}
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {changing ? '修改中...' : '修改密码'}
            </button>
          </div>
        </section>

        {/* 设备管理 */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">登录设备管理</h2>
          {loadingSessions ? (
            <p className="text-sm text-gray-400">加载中...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400">暂无活跃设备</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 truncate">{s.ip || '未知IP'}</span>
                      {s.current && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          当前设备
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.loginTime || ''}</p>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => handleKickSession(s.id)}
                      className="text-xs text-red-500 hover:text-red-600 ml-3"
                    >
                      踢出
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 账号注销 */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-red-600 mb-3">账号注销</h2>
          <p className="text-sm text-gray-500 mb-3">
            注销后您的个人信息将被匿名化处理，学习数据将被保留用于系统统计。提交申请后有7天冷静期，期间登录将自动撤销注销。
          </p>
          <button
            onClick={() => setShowDeactivateConfirm(true)}
            className="w-full py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50"
          >
            申请注销账号
          </button>
        </section>
      </div>

      {/* 注销确认弹窗 */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认注销</h3>
            <p className="text-sm text-gray-500 mb-4">
              注销申请提交后有7天冷静期，期间登录将自动撤销。到期后账号数据将被匿名化处理，此操作不可撤销。确定继续吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDeactivate}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                确认注销
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          visible={true}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  )
}
