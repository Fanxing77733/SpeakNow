/**
 * 离线跟读练习页 — 无网络时使用 IndexedDB 存储录音，联网后同步
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSentences, saveRecord } from '../../utils/offlineDb'
import type { OfflinePackSentence } from '../../api/offline'
import { useRecorder } from '../../hooks/useRecorder'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import Toast from '../../components/ui/Toast'

export default function OfflinePracticePage() {
  const navigate = useNavigate()
  const [sentences, setSentences] = useState<OfflinePackSentence[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [status, setStatus] = useState<'idle' | 'recording' | 'result'>('idle')
  const [lastScore, setLastScore] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus()
  const { duration, startRecording, stopRecording, reset: resetRecorder } = useRecorder()

  useEffect(() => {
    loadSentences()
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    if (wasOffline && isOnline) {
      setToast('网络已恢复，可前往"离线模式"页面同步练习记录')
      resetWasOffline()
    }
  }, [isOnline, wasOffline])

  async function loadSentences() {
    const data = await getSentences()
    if (data.length === 0) {
      setToast('还没有离线练习内容，请先下载离线包')
      return
    }
    setSentences(data)
  }

  const currentSentence = sentences[currentIdx]

  async function handleStartRecording() {
    setStatus('recording')
    await startRecording()
  }

  async function handleStopRecording() {
    const blob = await stopRecording()
    if (!blob || !currentSentence) {
      setToast('未录制到有效语音')
      setStatus('idle')
      return
    }

    // 保存到 IndexedDB（不调用后端 API）
    try {
      await saveRecord({
        id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        contentId: currentSentence.id,
        referenceText: currentSentence.text,
        durationSeconds: duration,
        audioBlob: blob,
        createdAt: new Date().toISOString(),
      })
      setLastScore('已保存，联网后自动同步评估')
      setStatus('result')
    } catch {
      setToast('保存失败，请检查存储空间')
      setStatus('idle')
    }
    resetRecorder()
  }

  function handleNext() {
    setStatus('idle')
    setLastScore(null)
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setCurrentIdx(0)
    }
  }

  if (sentences.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 mb-4">还没有离线练习内容</p>
        <button
          onClick={() => navigate('/offline')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          前往下载离线包
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">离线跟读练习</h1>
          <p className="text-xs text-gray-500">第 {currentIdx + 1}/{sentences.length} 句</p>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
              离线模式
            </span>
          )}
          <button
            onClick={() => navigate('/offline')}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            返回
          </button>
        </div>
      </div>

      {/* Reference text */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <p className="text-lg text-center text-gray-900 leading-relaxed">{currentSentence?.text}</p>
        {currentSentence?.topicTag && (
          <p className="text-xs text-center text-gray-400 mt-2">标签：{currentSentence.topicTag}</p>
        )}
      </div>

      {/* Play demo */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => {
            if (!window.speechSynthesis) return
            window.speechSynthesis.cancel()
            const u = new SpeechSynthesisUtterance(currentSentence?.text)
            u.lang = 'en-US'
            u.rate = 0.85
            window.speechSynthesis.speak(u)
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          播放示范音
        </button>
      </div>

      {/* Recording control */}
      {status === 'idle' && (
        <div className="flex justify-center mb-6">
          <button
            onPointerDown={handleStartRecording}
            className="w-24 h-24 rounded-full bg-white border-2 border-red-400 flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-md"
          >
            <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>
      )}

      {status === 'recording' && (
        <div className="flex justify-center mb-6">
          <button
            onPointerUp={handleStopRecording}
            onPointerLeave={handleStopRecording}
            className="w-24 h-24 rounded-full bg-red-500 animate-recording-pulse flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-lg"
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="2" width="12" height="20" rx="6" />
            </svg>
          </button>
        </div>
      )}

      {status === 'recording' && (
        <p className="text-center text-sm text-gray-500 mb-4">松手结束录音</p>
      )}

      {/* Result */}
      {status === 'result' && lastScore && (
        <div className="bg-green-50 rounded-xl p-4 mb-4 text-center">
          <p className="text-green-700 font-medium text-sm">{lastScore}</p>
          <p className="text-xs text-green-500 mt-1">录音已保存到本地</p>
        </div>
      )}

      {/* Next button */}
      {status === 'result' && (
        <button
          onClick={handleNext}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          下一句
        </button>
      )}

      {/* Pending sync hint */}
      {status === 'idle' && (
        <p className="text-center text-xs text-gray-400 mt-8">
          {isOnline
            ? '当前在线，录音后自动保存到本地'
            : '当前离线，录音保存在本地，联网后自动同步'}
        </p>
      )}

      {toast && <Toast visible={true} message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
