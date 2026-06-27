/**
 * 骨架屏组件
 *
 * 用于加载态占位，避免页面跳动。
 * 支持多种预设形状：文字行、圆形头像、矩形卡片等。
 */

interface SkeletonProps {
  /** 骨架屏形状 */
  variant?: 'text' | 'circular' | 'rectangular'
  /** 宽度 */
  width?: string | number
  /** 高度 */
  height?: string | number
  /** 额外样式类 */
  className?: string
}

const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) => {
  const baseStyle = 'animate-pulse bg-gray-200 rounded'

  const variantStyles: Record<string, string> = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? 40 : '100%'),
    height: height ?? (variant === 'circular' ? 40 : variant === 'rectangular' ? 120 : 16),
  }

  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export default Skeleton
