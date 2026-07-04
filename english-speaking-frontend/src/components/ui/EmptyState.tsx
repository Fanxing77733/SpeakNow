/**
 * 空状态组件 — Claymorphism 风格
 */
import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** 可选：设置 action 的跳转路径 */
  actionPath?: string
}

const EmptyState = ({
  title = '暂无数据',
  description = '开始你的第一次练习吧！',
  actionLabel,
  onAction,
  actionPath,
}: EmptyStateProps) => {
  const navigate = useNavigate()

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else if (actionPath) {
      navigate(actionPath)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* 装饰图标 */}
      <div className="clay-card w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-teal-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-teal-800 mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
        {title}
      </h3>
      <p className="text-sm text-teal-600/50 mb-8 text-center max-w-xs">{description}</p>

      {(actionLabel && (onAction || actionPath)) && (
        <button
          type="button"
          onClick={handleAction}
          className="clay-btn px-6 py-2.5 text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
