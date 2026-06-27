/**
 * 数字渐增动画 Hook
 *
 * 使用 requestAnimationFrame + easeOutCubic 缓动，
 * 在指定时间内将数字从 0 滚动到目标值。
 */
import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 800, enabled = true): number {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // 不需要动画时直接展示目标值
    if (!enabled || target <= 0) {
      setDisplayValue(target)
      return
    }

    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!mountedRef.current) return

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // easeOutCubic 缓出曲线
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    // 延迟一帧启动，确保 DOM 已就绪
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }, 50)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, enabled])

  return displayValue
}
