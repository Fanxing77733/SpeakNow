/**
 * 注册页 — Claymorphism 风格
 */
import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { GOAL_OPTIONS, type GoalType } from '../../types/auth'
import Toast from '../../components/ui/Toast'

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

  const ageOptions = Array.from({ length: 94 }, (_, i) => i + 6)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!email.trim() && !phone.trim()) {
      errors.email = '请填写邮箱或手机号'
      errors.phone = '请填写邮箱或手机号'
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = '邮箱格式不正确'
    }
    if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      errors.phone = '手机号格式不正确'
    }
    const pwError = validatePassword(password)
    if (pwError) errors.password = pwError
    if (!confirmPassword) {
      errors.confirmPassword = '请确认密码'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }
    if (age === '' || age < 6 || age > 99) errors.age = '请选择年龄（6-99 岁）'
    if (!goal) errors.goal = '请选择学习目标'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

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
    } catch { /* error handled in store */ }
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none bg-white/80 backdrop-blur-sm
    ${hasError ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-teal-200/60 focus:border-teal-400 focus:ring-4 focus:ring-teal-50'}
    text-teal-900 placeholder:text-teal-400/60`

  const selectClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none bg-white/80 backdrop-blur-sm
    ${hasError ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-teal-200/60 focus:border-teal-400 focus:ring-4 focus:ring-teal-50'}
    text-teal-900`

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #E8FAF6 50%, #F0FDFA 100%)' }}>
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 40%, #2DD4BF 100%)' }}>
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
            开始你的口语之旅
          </h1>
          <p className="text-teal-100/90 text-lg text-center max-w-sm leading-relaxed font-medium">
            创建账号，获取个性化学习体验<br />
            <span className="text-white/80 text-sm">智能评测 + 情景对话，快速提升口语</span>
          </p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0D9488, #2DD4BF)' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-teal-700" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>SpeakingNow</h1>
          </div>

          <div className="clay-card p-8">
            <h2 className="text-2xl font-extrabold text-teal-800 mb-1" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              创建账号
            </h2>
            <p className="text-sm text-teal-600/50 mb-7">填写信息，开启学习之旅</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* 邮箱 */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-teal-700 mb-1.5">邮箱</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); clearFieldError('email') }}
                  placeholder="请输入邮箱地址"
                  maxLength={100}
                  className={inputClass(!!fieldErrors.email)}
                />
                {fieldErrors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.email}</p>}
              </div>

              {/* 手机号 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-teal-700 mb-1.5">手机号</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setPhone(e.target.value); clearFieldError('phone') }}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className={inputClass(!!fieldErrors.phone)}
                />
                {fieldErrors.phone && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.phone}</p>}
              </div>
              <p className="!mt-1 text-xs text-teal-400/60 font-medium">邮箱和手机号至少填写一个</p>

              {/* 密码 */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-teal-700 mb-1.5">密码</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); clearFieldError('password') }}
                  placeholder="8-20 位，至少含字母和数字"
                  maxLength={20}
                  autoComplete="new-password"
                  className={inputClass(!!fieldErrors.password)}
                />
                {fieldErrors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.password}</p>}
              </div>

              {/* 确认密码 */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-teal-700 mb-1.5">确认密码</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword') }}
                  placeholder="请再次输入密码"
                  maxLength={20}
                  autoComplete="new-password"
                  className={inputClass(!!fieldErrors.confirmPassword)}
                />
                {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.confirmPassword}</p>}
              </div>

              {/* 年龄 */}
              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-teal-700 mb-1.5">年龄</label>
                <select
                  id="age"
                  value={age}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => { setAge(e.target.value ? Number(e.target.value) : ''); clearFieldError('age') }}
                  className={selectClass(!!fieldErrors.age)}
                >
                  <option value="">请选择年龄</option>
                  {ageOptions.map((n) => (
                    <option key={n} value={n}>{n} 岁</option>
                  ))}
                </select>
                {fieldErrors.age && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.age}</p>}
              </div>

              {/* 学习目标 */}
              <div>
                <label className="block text-sm font-semibold text-teal-700 mb-2">学习目标</label>
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setGoal(opt.value); clearFieldError('goal') }}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200
                        ${goal === opt.value
                          ? 'border-teal-400 bg-teal-50 shadow-sm'
                          : 'border-teal-200/60 hover:border-teal-300 hover:bg-teal-50/50'}
                        ${fieldErrors.goal ? 'border-red-300' : ''}`}
                    >
                      <div className={`text-sm font-semibold ${goal === opt.value ? 'text-teal-700' : 'text-teal-700/70'}`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-teal-600/40 mt-0.5 leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                {fieldErrors.goal && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.goal}</p>}
              </div>

              {/* 注册按钮 */}
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
                {isLoading ? '注册中...' : '注册'}
              </button>
            </form>

            <p className="text-sm text-center text-teal-600/50 mt-6">
              已有账号？{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                立即登录
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

export default RegisterPage
