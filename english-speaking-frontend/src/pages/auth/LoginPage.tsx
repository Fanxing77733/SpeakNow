/**
 * 登录页 — Claymorphism + 渐变品牌区
 */
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Toast from '../../components/ui/Toast'

const getHomePath = (role?: string | null) => {
  if (role === 'TEACHER') return '/admin/teacher/classes'
  if (role === 'OPERATOR' || role === 'ADMIN') return '/admin/operator/dashboard'
  return '/'
}

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ account?: string; password?: string }>({})

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      useAuthStore.getState().setAuth(token, null as any)
      const redirect = searchParams.get('redirect') || getHomePath()
      navigate(redirect, { replace: true })
    }
  }, [searchParams])

  if (isAuthenticated) {
    const role = useAuthStore.getState().user?.role
    const redirect = searchParams.get('redirect') || getHomePath(role)
    navigate(redirect, { replace: true })
    return null
  }

  function validate(): boolean {
    const errors: { account?: string; password?: string } = {}
    if (!account.trim()) errors.account = '请输入邮箱或手机号'
    if (!password) errors.password = '请输入密码'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    if (!validate()) return
    try {
      await login({ account: account.trim(), password })
      const role = useAuthStore.getState().user?.role
      const redirect = searchParams.get('redirect') || getHomePath(role)
      navigate(redirect, { replace: true })
    } catch { /* error handled in store */ }
  }

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none bg-white/80 backdrop-blur-sm
    ${hasError ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-teal-200/60 focus:border-teal-400 focus:ring-4 focus:ring-teal-50'}
    text-teal-900 placeholder:text-teal-400/60`

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #E8FAF6 50%, #F0FDFA 100%)' }}>
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 40%, #2DD4BF 100%)' }}>
        {/* 装饰光斑 */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            SpeakingNow
          </h1>
          <p className="text-teal-100/90 text-lg text-center max-w-sm leading-relaxed font-medium">
            智能音素级发音评测 + 大模型情景对话<br />
            <span className="text-white/80 text-sm">练习 → 评测 → 纠正 → 应用</span>
          </p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* 移动端品牌 */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0D9488, #2DD4BF)' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-teal-700" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>SpeakingNow</h1>
          </div>

          {/* 表单卡片 */}
          <div className="clay-card p-8">
            <h2 className="text-2xl font-extrabold text-teal-800 mb-1" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              欢迎回来
            </h2>
            <p className="text-sm text-teal-600/50 mb-7">登录你的账号，继续学习</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* 账号 */}
              <div>
                <label htmlFor="account" className="block text-sm font-semibold text-teal-700 mb-1.5">
                  账号
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-teal-400">
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
                    className={inputClass(!!fieldErrors.account)}
                  />
                </div>
                {fieldErrors.account && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.account}</p>}
              </div>

              {/* 密码 */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-teal-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-teal-400">
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
                    className={inputClass(!!fieldErrors.password) + ' pr-12'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-teal-400 hover:text-teal-600 transition-colors"
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
                {fieldErrors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.password}</p>}
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="clay-btn w-full py-3 text-sm flex items-center justify-center gap-2"
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

            {/* 微信登录 */}
            <div className="mt-5">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-teal-200/40" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-teal-400/60 font-medium">其他方式登录</span></div>
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = '/api/v1/auth/wechat/authorize' }}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-200 text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/>
                </svg>
                微信登录
              </button>
            </div>

            {/* 注册链接 */}
            <p className="text-sm text-center text-teal-600/50 mt-6">
              还没有账号？{' '}
              <Link to="/register" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                立即注册
              </Link>
            </p>
          </div>

          <p className="text-xs text-center text-teal-400/50 mt-6 font-medium">
            SpeakingNow &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <Toast type="error" message={error || ''} visible={!!error} onClose={clearError} />
    </div>
  )
}

export default LoginPage
