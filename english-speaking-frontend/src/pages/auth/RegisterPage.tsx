/**
 * 注册页
 *
 * 页面布局（与登录页对称风格）：
 * - 桌面端：左侧品牌区 + 右侧表单区
 * - 移动端：上下堆叠
 *
 * 校验：
 * - 邮箱/手机号至少填一个
 * - 密码 8-20 位，包含字母和数字
 * - 确认密码与密码一致
 * - 年龄 6-99
 * - 学习目标必选
 */
import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { GOAL_OPTIONS, type GoalType } from '../../types/auth'
import Toast from '../../components/ui/Toast'

/** 密码校验规则：8-20 位，至少含 1 字母 + 1 数字 */
function validatePassword(pw: string): string | null {
  if (!pw) return '请输入密码'
  if (pw.length < 8) return '密码至少需要 8 位'
  if (pw.length > 20) return '密码最多 20 位'
  if (!/[a-zA-Z]/.test(pw)) return '密码需要包含字母'
  if (!/\d/.test(pw)) return '密码需要包含数字'
  return null
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [goal, setGoal] = useState<GoalType | ''>('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  /** 生成年龄选项 6-99 */
  const ageOptions = Array.from({ length: 94 }, (_, i) => i + 6)

  /** 表单校验 */
  function validate(): boolean {
    const errors: Record<string, string> = {}

    // 邮箱/手机号至少填一个
    if (!email.trim() && !phone.trim()) {
      errors.email = '请填写邮箱或手机号'
      errors.phone = '请填写邮箱或手机号'
    }

    // 邮箱格式（如果填写了）
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = '邮箱格式不正确'
    }

    // 手机号格式（如果填写了）
    if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      errors.phone = '手机号格式不正确'
    }

    // 密码校验
    const pwError = validatePassword(password)
    if (pwError) {
      errors.password = pwError
    }

    // 确认密码
    if (!confirmPassword) {
      errors.confirmPassword = '请确认密码'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    // 年龄
    if (age === '' || age < 6 || age > 99) {
      errors.age = '请选择年龄（6-99 岁）'
    }

    // 学习目标
    if (!goal) {
      errors.goal = '请选择学习目标'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  /** 提交注册 */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()

    if (!validate()) return

    try {
      await register({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        age: age as number,
        goal: goal as GoalType,
      })
      navigate('/', { replace: true })
    } catch {
      // 错误已在 Store 中设置
    }
  }

  /** 清除指定字段的错误 */
  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* ====== 左侧品牌区 ====== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col items-center justify-center px-12 text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">开始你的口语之旅</h1>
        <p className="text-blue-100 text-base text-center max-w-sm leading-relaxed">
          创建账号，获取个性化的英语口语学习体验。<br />
          智能评测 + 情景对话，让你的口语快速提升。
        </p>
      </div>

      {/* ====== 右侧表单区 ====== */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* 移动端品牌 Logo + 标题 */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AI 英语口语训练</h1>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">创建账号</h2>
            <p className="text-sm text-gray-500 mb-6">填写信息，开启学习之旅</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* 邮箱 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  placeholder="请输入邮箱地址"
                  maxLength={100}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                    ${fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                    text-gray-900 placeholder:text-gray-400`}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* 手机号 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  手机号
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPhone(e.target.value)
                    clearFieldError('phone')
                  }}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                    ${fieldErrors.phone ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                    text-gray-900 placeholder:text-gray-400`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.phone}</p>
                )}
              </div>

              <p className="!mt-1 text-xs text-gray-400">邮箱和手机号至少填写一个</p>

              {/* 密码 */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    clearFieldError('password')
                  }}
                  placeholder="8-20 位，至少含字母和数字"
                  maxLength={20}
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                    ${fieldErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                    text-gray-900 placeholder:text-gray-400`}
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* 确认密码 */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  确认密码
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setConfirmPassword(e.target.value)
                    clearFieldError('confirmPassword')
                  }}
                  placeholder="请再次输入密码"
                  maxLength={20}
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                    ${fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                    text-gray-900 placeholder:text-gray-400`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* 年龄选择器 */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1.5">
                  年龄
                </label>
                <select
                  id="age"
                  value={age}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setAge(e.target.value ? Number(e.target.value) : '')
                    clearFieldError('age')
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none bg-white
                    ${fieldErrors.age ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                    text-gray-900`}
                >
                  <option value="">请选择年龄</option>
                  {ageOptions.map((n) => (
                    <option key={n} value={n}>
                      {n} 岁
                    </option>
                  ))}
                </select>
                {fieldErrors.age && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.age}</p>
                )}
              </div>

              {/* 学习目标卡片选择器 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学习目标
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setGoal(opt.value)
                        clearFieldError('goal')
                      }}
                      className={`p-3 rounded-lg border-2 text-center transition-all
                        ${goal === opt.value
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                        ${fieldErrors.goal ? 'border-red-300' : ''}`}
                    >
                      <div className={`text-sm font-medium ${goal === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
                {fieldErrors.goal && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.goal}</p>
                )}
              </div>

              {/* 注册按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isLoading ? '注册中...' : '注册'}
              </button>
            </form>

            {/* 登录链接 */}
            <p className="text-sm text-center text-gray-500 mt-6">
              已有账号？{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                立即登录
              </Link>
            </p>
          </div>

          {/* 底部版权 */}
          <p className="text-xs text-center text-gray-400 mt-6">
            AI English Speaking Training &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* 错误 Toast */}
      <Toast
        type="error"
        message={error || ''}
        visible={!!error}
        onClose={clearError}
      />
    </div>
  )
}

export default RegisterPage
