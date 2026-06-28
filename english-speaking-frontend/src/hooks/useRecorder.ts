/**
 * 录音 Hook — Push-to-Talk 模式
 *
 * 长按录音，松手结束。使用 MediaRecorder API。
 *
 * TODO: Step 4 实现 — 完整的录音逻辑
 * - 前置校验：录音 <0.5s → "未检测到有效语音"
 * - 录音 >60s → 自动截断
 * - 上传前校验音频 ≤5MB
 * - 波形动画（Web Audio API AnalyserNode）
 */
import { useRef, useCallback, useState } from 'react'
import { webmToWav } from '../utils/audio'

interface UseRecorderReturn {
  /** 是否正在录音 */
  isRecording: boolean
  /** 录音时长（秒） */
  duration: number
  /** 录音 Blob（录音结束后可用） */
  audioBlob: Blob | null
  /** 错误信息 */
  error: string | null
  /** 开始录音 */
  startRecording: () => Promise<void>
  /** 停止录音 */
  stopRecording: () => Promise<Blob | null>
  /** 重置状态 */
  reset: () => void
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    // TODO: Step 4 实现
    setError(null)
    setAudioBlob(null)
    setDuration(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)

        // 释放麦克风
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      mediaRecorder.start()
      startTimeRef.current = Date.now()
      setIsRecording(true)

      // 启动计时器
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)

        // 超过 60 秒自动截断
        if (elapsed >= 60) {
          mediaRecorder.stop()
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setIsRecording(false)
        }
      }, 100)
    } catch {
      setError('无法访问麦克风，请检查浏览器权限设置')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = async () => {
          const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' })

          // 释放麦克风
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
          }

          // 校验录音时长
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          if (elapsed < 0.5) {
            setError('未检测到有效语音，请重新朗读')
            setAudioBlob(null)
            resolve(null)
            return
          }

          // 转 WAV（腾讯云 ASR 要求）
          try {
            const wavBlob = await webmToWav(rawBlob)
            setAudioBlob(wavBlob)
            resolve(wavBlob)
          } catch {
            setAudioBlob(rawBlob)
            resolve(rawBlob)
          }
        }

        mediaRecorderRef.current.stop()
      } else {
        resolve(null)
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setIsRecording(false)
    })
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setError(null)
    setIsRecording(false)
  }, [])

  return {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    reset,
  }
}
