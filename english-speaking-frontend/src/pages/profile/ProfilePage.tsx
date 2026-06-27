/**
 * 个人资料页
 *
 * 页面布局：
 * - 顶部：用户头像 + 昵称 + 等级标签
 * - 信息卡片：各字段只读/可编辑展示
 * - "保存修改" 按钮
 * - "退出登录" 按钮（红色，二次确认弹窗）
 *
 * 交互：
 * - 进入页面 → 骨架屏 → 加载用户数据 → 渲染
 * - 编辑：昵称/年龄/目标可直接修改
 * - 保存 loading → 成功 Toast → 年龄/目标变更提示
 * - 退出登录：弹窗确认 → 清空状态 → 跳转登录页
 * - 数据加载失败 → 友好错误提示 + 重试按钮
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { GOAL_OPTIONS, type GoalType } from '../../types/auth'
import { formatDate } from '../../utils/format'
import Skeleton from '../../components/ui/Skeleton'
import Toast from '../../components/ui/Toast'

/** 等级 → 徽章样式映射 */
const LEVEL_BADGE_STYLES: Record<string, string> = {
  beginner: 'bg-amber-100 text-amber-800 border-amber-200',
  intermediate: 'bg-gray-100 text-gray-700 border-gray-200',
  advanced: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  A1: 'bg-amber-100 text-amber-800 border-amber-200',
  A2: 'bg-orange-100 text-orange-800 border-orange-200',
  B1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  B2: 'bg-lime-100 text-lime-800 border-lime-200',
  C1: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  C2: 'bg-sky-100 text-sky-800 border-sky-200',
}

/** 等级 → 中文映射 */
const LEVEL_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
  A1: 'A1 入门级',
  A2: 'A2 基础级',
  B1: 'B1 进阶级',
  B2: 'B2 高阶级',
  C1: 'C1 流利级',
  C2: 'C2 精通级',
}

/** 脱敏手机号：138****5678 */
function maskPhone(phone: string): string {
  if (phone.length >= 7) {
    return phone.slice(0, 3) + '****' + phone.slice(-4)
  }
  return phone
}

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, isLoading, error, fetchProfile, updateProfile, logout, clearError } = useAuthStore()

  // 编辑态字段
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [goal, setGoal] = useState<GoalType | ''>('')

  // 初始值（用于判断是否有修改）
  const [initialValues, setInitialValues] = useState<{ nickname: string; age: number | ''; goal: string }>({
    nickname: '',
    age: '',
    goal: '',
  })

  // 是否正在保存
  const [isSaving, setIsSaving] = useState(false)
  // Toast 状态
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')
  // 退出确认弹窗
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const ageOptions = Array.from({ length: 94 }, (_, i) => i + 6)

  /** 加载用户数据 */
  const loadProfile = useCallback(async () => {
    try {
      await fetchProfile()
    } catch {
      // 错误已在 Store 中设置
    }
  }, [fetchProfile])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  /** 用户数据回填表单 */
  useEffect(() => {
    if (user) {
      const n = user.nickname || ''
      const a = user.age ?? ''
      const g = user.goal || ''
      setNickname(n)
      setAge(a)
      setGoal(g)
      setInitialValues({ nickname: n, age: a, goal: g })
    }
  }, [user])

  /** 是否已修改 */
  const isDirty =
    nickname !== initialValues.nickname ||
    age !== initialValues.age ||
    goal !== initialValues.goal

  /** 保存修改 */
  async function handleSave() {
    setIsSaving(true)
    clearError()
    try {
      await updateProfile({
        nickname: nickname.trim() || undefined,
        age: age === '' ? undefined : (age as number),
        goal: goal === '' ? undefined : (goal as GoalType),
      })

      // 更新初始值
      setInitialValues({ nickname, age, goal })

      // 检测年龄或目标是否变更
      const ageChanged = age !== initialValues.age
      const goalChanged = goal !== initialValues.goal

      if (ageChanged || goalChanged) {
        setToastType('info')
        setToastMessage('资料已保存。年龄或学习目标变更后，内容推荐将同步调整。')
      } else {
        setToastType('success')
        setToastMessage('资料保存成功')
      }
      setToastVisible(true)
    } catch {
      setToastType('error')
      setToastMessage(error || '保存失败，请稍后重试')
      setToastVisible(true)
    } finally {
      setIsSaving(false)
    }
  }

  /** 退出登录 */
  function handleLogout() {
    setShowLogoutConfirm(false)
    logout()
    navigate('/login', { replace: true })
  }

  // ====== 加载态：骨架屏 ======
  if (isLoading && !user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h1>
        {/* 用户头部骨架 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="space-y-2">
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={80} height={12} />
            </div>
          </div>
        </div>
        {/* 信息卡片骨架 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton variant="text" width={60} height={14} />
                <Skeleton variant="text" width={200} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ====== 错误态 ======
  if (error && !user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // ====== 空态（不应出现，但做兜底） ======
  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">暂无用户数据</p>
        </div>
      </div>
    )
  }

  // ====== 正常展示 ======
  const levelBadge = user.level ? LEVEL_BADGE_STYLES[user.level] || 'bg-gray-100 text-gray-700 border-gray-200' : ''
  const levelLabel = user.level ? LEVEL_LABELS[user.level] || user.level : '未定级'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h1>

      {/* ====== 用户头部卡片 ====== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* 默认头像占位 */}
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-xl font-bold">
              {(user.nickname || user.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user.nickname || '未设置昵称'}
            </h2>
            {user.level && (
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelBadge}`}
              >
                {levelLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====== 信息编辑卡片 ====== */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="space-y-6">

          {/* 邮箱 — 只读 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">邮箱</label>
            <span className="text-sm text-gray-900">{user.email || '未绑定'}</span>
          </div>

          {/* 手机号 — 只读，脱敏 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">手机号</label>
            <span className="text-sm text-gray-900">
              {user.phone ? maskPhone(user.phone) : '未绑定'}
            </span>
          </div>

          {/* 分隔线 */}
          <hr className="border-gray-100" />

          {/* 昵称 — 可编辑 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
            <label htmlFor="nickname" className="text-sm font-medium text-gray-600 w-20 flex-shrink-0 mt-2">
              昵称
            </label>
            <div className="flex-1">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                maxLength={20}
                className="w-full sm:max-w-xs px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors text-gray-900 placeholder:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">最多 20 个字符</p>
            </div>
          </div>

          {/* 年龄 — 可编辑 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
            <label htmlFor="profile-age" className="text-sm font-medium text-gray-600 w-20 flex-shrink-0 mt-2">
              年龄
            </label>
            <div>
              <select
                id="profile-age"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors text-gray-900"
              >
                <option value="">请选择年龄</option>
                {ageOptions.map((n) => (
                  <option key={n} value={n}>
                    {n} 岁
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 学习目标 — 可编辑 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
            <label className="text-sm font-medium text-gray-600 w-20 flex-shrink-0 mt-2">
              学习目标
            </label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGoal(opt.value)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-all
                      ${goal === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {opt.label}
                    <span className="ml-1 text-xs text-gray-400 hidden sm:inline">
                      ({opt.desc})
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-400 sm:hidden">
                {GOAL_OPTIONS.map((opt) => (
                  goal === opt.value ? <span key={opt.value}>{opt.desc}</span> : null
                ))}
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <hr className="border-gray-100" />

          {/* 注册时间 — 只读 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">注册时间</label>
            <span className="text-sm text-gray-900">
              {user.createdAt ? formatDate(user.createdAt) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* ====== 保存按钮 ====== */}
      <div className="mb-4">
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSaving && (
            <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSaving ? '保存中...' : '保存修改'}
        </button>
        {isDirty && (
          <span className="ml-3 text-xs text-amber-600">有未保存的修改</span>
        )}
      </div>

      {/* ====== 退出登录按钮 ====== */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* ====== 退出登录确认弹窗 ====== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认退出</h3>
            <p className="text-sm text-gray-500 mb-6">退出后需要重新登录，确定要退出吗？</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Toast 通知 ====== */}
      <Toast
        type={toastType}
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  )
}

export default ProfilePage
