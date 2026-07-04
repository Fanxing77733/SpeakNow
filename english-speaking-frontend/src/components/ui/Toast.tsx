/**
 * Toast 通知组件 — Claymorphism 风格
 */
import { type ReactNode } from 'react'

interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  message: ReactNode
  visible: boolean
  onClose?: () => void
}

const iconMap: Record<string, ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const typeStyles: Record<string, string> = {
  success: 'bg-white/90 text-emerald-700 border-emerald-200',
  error: 'bg-white/90 text-red-700 border-red-200',
  warning: 'bg-white/90 text-amber-700 border-amber-200',
  info: 'bg-white/90 text-teal-700 border-teal-200',
}

const Toast = ({ type = 'info', message, visible, onClose }: ToastProps) => {
  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm animate-fade-in-up">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg backdrop-blur-xl ${typeStyles[type]}`}
        style={{
          boxShadow: '4px 4px 12px rgba(13,148,136,0.08), -4px -4px 12px rgba(255,255,255,0.9)',
        }}>
        <span className="shrink-0">{iconMap[type]}</span>
        <span className="text-sm font-medium flex-1">{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="关闭通知"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default Toast
