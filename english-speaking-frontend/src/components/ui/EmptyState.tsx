/**
 * 空状态组件
 *
 * 当页面无数据时展示占位图和引导文案。
 */

interface EmptyStateProps {
  /** 引导文案标题 */
  title?: string
  /** 引导文案描述 */
  description?: string
  /** 操作按钮文字 */
  actionLabel?: string
  /** 操作按钮点击回调 */
  onAction?: () => void
}

const EmptyState = ({
  title = '暂无数据',
  description = '开始你的第一次练习吧！',
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 占位图 */}
      <div className="w-32 h-32 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
