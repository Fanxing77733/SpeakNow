/**
 * Toast 通知组件
 *
 * 轻量级 Toast，用于成功/错误/警告提示。
 * 当前为骨架版本，后续可扩展为全局 Toast 管理器。
 *
 * TODO: 替换为全局 Toast Context + 动画效果
 */
import { type ReactNode } from 'react'

interface ToastProps {
  /** Toast 类型 */
  type?: 'success' | 'error' | 'warning' | 'info'
  /** 提示文字 */
  message: ReactNode
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose?: () => void
}

const typeStyles: Record<string, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}

const Toast = ({ type = 'info', message, visible, onClose }: ToastProps) => {
  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg ${typeStyles[type]}`}>
        <span className="text-sm flex-1">{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-current opacity-50 hover:opacity-100 ml-2"
            aria-label="关闭通知"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  )
}

export default Toast
