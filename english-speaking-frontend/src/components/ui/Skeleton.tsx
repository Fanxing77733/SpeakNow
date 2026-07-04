/**
 * 骨架屏组件 — Claymorphism 风格
 */
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  className?: string
}

const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) => {
  const baseStyle = 'animate-pulse'
  const colorStyle = 'bg-teal-100/60'

  const variantStyles: Record<string, string> = {
    text: 'h-4 rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  }

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? 40 : '100%'),
    height: height ?? (variant === 'circular' ? 40 : variant === 'rectangular' ? 120 : 16),
  }

  return (
    <div
      className={`${baseStyle} ${colorStyle} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export default Skeleton
