/**
 * 倒计时 Hook
 *
 * 用于测评限时、录音倒计时等场景。
 */
import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCountdownReturn {
  /** 剩余秒数 */
  remaining: number
  /** 是否正在倒计时 */
  isRunning: boolean
  /** 是否已结束 */
  isFinished: boolean
  /** 开始倒计时 */
  start: (seconds: number) => void
  /** 暂停 */
  pause: () => void
  /** 恢复 */
  resume: () => void
  /** 重置 */
  reset: () => void
}

export function useCountdown(): UseCountdownReturn {
  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const totalRef = useRef(0)

  // 倒计时结束时自动触发
  useEffect(() => {
    if (!isRunning || remaining <= 0) return

    if (remaining <= 0) {
      setIsRunning(false)
      setIsFinished(true)
      return
    }

    const timer = setTimeout(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          setIsFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [isRunning, remaining])

  const start = useCallback((seconds: number) => {
    totalRef.current = seconds
    setRemaining(seconds)
    setIsRunning(true)
    setIsFinished(false)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (remaining > 0) {
      setIsRunning(true)
      setIsFinished(false)
    }
  }, [remaining])

  const reset = useCallback(() => {
    setRemaining(0)
    setIsRunning(false)
    setIsFinished(false)
  }, [])

  return { remaining, isRunning, isFinished, start, pause, resume, reset }
}
