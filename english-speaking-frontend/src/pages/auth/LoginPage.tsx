/**
 * 登录页
 *
 * 页面布局：
 * - 桌面端：左侧品牌区 + 右侧表单区（左右分栏）
 * - 移动端：上下堆叠
 *
 * 交互：
 * - 表单实时校验（账号/密码非空）
 * - 登录 loading 态禁用按钮
 * - 错误提示按 HTTP 状态码映射友好文案
 * - 登录成功跳转 redirect 参数或首页
 * - 已登录用户自动跳转首页
 */
import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Toast from '../../components/ui/Toast'

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ account?: string; password?: string }>({})

  // 已登录用户自动跳转首页
  if (isAuthenticated) {
    const redirect = searchParams.get('redirect') || '/'
    navigate(redirect, { replace: true })
    return null
  }

  /** 表单校验 */
  function validate(): boolean {
    const errors: { account?: string; password?: string } = {}

    if (!account.trim()) {
      errors.account = '请输入邮箱或手机号'
    }

    if (!password) {
      errors.password = '请输入密码'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  /** 提交登录 */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()

    if (!validate()) return

    try {
      await login({ account: account.trim(), password })
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect, { replace: true })
    } catch {
      // 错误已在 Store 中设置，此处仅阻止跳转
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* ====== 左侧品牌区 ====== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col items-center justify-center px-12 text-white">
        {/* Logo 占位 */}
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">AI 英语口语训练</h1>
        <p className="text-blue-100 text-base text-center max-w-sm leading-relaxed">
          智能音素级发音评测，大模型情景对话。<br />
          练习 → 评测 → 纠正 → 应用，提升口语能力。
        </p>
        {/* 练习→评测→纠正→应用 流程示意 */}
        <div className="flex items-center gap-3 mt-8 text-blue-200 text-sm">
          {['练习', '评测', '纠正', '应用'].map((step, i) => (
            <span key={step} className="flex items-center gap-1">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">
                {i + 1}
              </span>
              <span>{step}</span>
              {i < 3 && <span className="ml-1 text-blue-300">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ====== 右侧表单区 ====== */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* 移动端品牌 Logo + 标题（桌面端隐藏） */}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">欢迎回来</h2>
            <p className="text-sm text-gray-500 mb-6">登录你的账号，继续学习</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* 账号输入框 */}
              <div>
                <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1.5">
                  账号
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    id="account"
                    type="text"
                    value={account}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setAccount(e.target.value)
                      if (fieldErrors.account) setFieldErrors((prev) => ({ ...prev, account: undefined }))
                    }}
                    placeholder="请输入邮箱或手机号"
                    maxLength={100}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                      ${fieldErrors.account ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                      text-gray-900 placeholder:text-gray-400`}
                  />
                </div>
                {fieldErrors.account && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.account}</p>
                )}
              </div>

              {/* 密码输入框 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    placeholder="请输入密码"
                    maxLength={20}
                    className={`w-full pl-10 pr-12 py-2.5 rounded-lg border text-sm transition-colors outline-none
                      ${fieldErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                      text-gray-900 placeholder:text-gray-400`}
                  />
                  {/* 密码显示/隐藏切换 */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* 登录按钮 */}
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
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            {/* 注册链接 */}
            <p className="text-sm text-center text-gray-500 mt-6">
              还没有账号？{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                立即注册
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

export default LoginPage
