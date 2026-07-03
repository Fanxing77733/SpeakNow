/**
 * 话题陈述页 — 30s 准备 + 1-2min 陈述 + LLM 评估
 */
import { useState, useEffect, useRef } from 'react'
import { getSpeechTopics, startSpeech, submitSpeech } from '../../api/speech'
import { useRecorder } from '../../hooks/useRecorder'
import Toast from '../../components/ui/Toast'
import type { SpeechTopic, SpeechEvalResult } from '../../types/speech'
import { SPEECH_CATEGORIES, SPEECH_DIFFICULTY_LABELS } from '../../types/speech'

type Step = 'select' | 'preparing' | 'speaking' | 'evaluating' | 'result'

export default function SpeechPage() {
  const [topics, setTopics] = useState<SpeechTopic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<SpeechTopic | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [category, setCategory] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [prepTimeLeft, setPrepTimeLeft] = useState(30)
  const [speechTimeLeft, setSpeechTimeLeft] = useState(0)
  const [result, setResult] = useState<SpeechEvalResult | null>(null)
  const [toast, setToast] = useState('')
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechMaxSeconds = selectedTopic?.speechSecondsMax || 120
  const { isRecording, duration, startRecording, stopRecording, reset: resetRecorder } = useRecorder(speechMaxSeconds)

  useEffect(() => {
    loadTopics()
    return () => {
      clearInterval(prepTimerRef.current!)
      clearInterval(speechTimerRef.current!)
    }
  }, [category])

  // 准备倒计时结束 → 开始陈述（放在 useEffect 中避免 React Strict Mode 下 setState 更新器双重调用）
  useEffect(() => {
    if (step === 'preparing' && prepTimeLeft === 0 && selectedTopic) {
      beginSpeaking(selectedTopic)
    }
  }, [step, prepTimeLeft])

  useEffect(() => {
    if (step === 'speaking' && duration >= (selectedTopic?.speechSecondsMax || 120)) {
      handleStopRecording()
    }
  }, [duration, step])

  async function loadTopics() {
    try {
      const data = await getSpeechTopics(category || undefined)
      setTopics(data)
    } catch { /* ignore */ }
  }

  async function handleSelectTopic(topic: SpeechTopic) {
    setSelectedTopic(topic)
    try {
      const sid = await startSpeech(topic.id)
      setSessionId(sid)
      setPrepTimeLeft(topic.preparationSeconds)
      setStep('preparing')

      prepTimerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setToast('无法开始陈述，请稍后重试')
    }
  }

  function beginSpeaking(topic: SpeechTopic) {
    setStep('speaking')
    setSpeechTimeLeft(topic.speechSecondsMax)
    startRecording()

    speechTimerRef.current = setInterval(() => {
      setSpeechTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(speechTimerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleStopRecording() {
    clearInterval(speechTimerRef.current!)
    const blob = await stopRecording()
    if (!blob || !sessionId) {
      setToast('未录制到有效语音')
      setStep('select')
      return
    }
    setStep('evaluating')
    try {
      const evalResult = await submitSpeech(sessionId, blob, duration)
      setResult(evalResult)
      setStep('result')
    } catch {
      setToast('评估服务繁忙，请稍后重试')
      setStep('select')
    }
  }

  function handleReset() {
    setSelectedTopic(null)
    setStep('select')
    setSessionId(null)
    setResult(null)
    resetRecorder()
    clearInterval(prepTimerRef.current!)
    clearInterval(speechTimerRef.current!)
  }

  if (step === 'preparing') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">准备阶段</h2>
          <p className="text-sm text-gray-500 mb-2">话题</p>
          <p className="text-lg font-semibold text-gray-900 mb-6">{selectedTopic?.title}</p>
          <p className="text-sm text-gray-600 mb-8">{selectedTopic?.description}</p>
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle
                cx="64" cy="64" r="56"
                stroke="#3b82f6" strokeWidth="8" fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - prepTimeLeft / (selectedTopic?.preparationSeconds || 30))}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${prepTimeLeft <= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                {prepTimeLeft}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">请利用这段时间组织语言</p>
          <button onClick={handleReset} className="mt-6 text-sm text-gray-400 hover:text-gray-600">
            返回重新选择
          </button>
        </div>
      </div>
    )
  }

  if (step === 'speaking') {
    const maxSpeech = selectedTopic?.speechSecondsMax || 120
    const minSpeech = selectedTopic?.speechSecondsMin || 60
    const progressPct = (speechTimeLeft / maxSpeech) * 100

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-2">陈述阶段</h2>
          <p className="text-sm text-gray-500 mb-4">{selectedTopic?.title}</p>

          {/* Timer bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                speechTimeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="text-center mb-6">
            <span className={`text-3xl font-bold ${speechTimeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
              {Math.floor(speechTimeLeft / 60)}:{String(speechTimeLeft % 60).padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-400 ml-2">/ {Math.floor(maxSpeech / 60)}:{String(maxSpeech % 60).padStart(2, '0')}</span>
          </div>

          {/* Recording button */}
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onPointerUp={handleStopRecording}
                className="w-24 h-24 rounded-full bg-red-500 animate-recording-pulse flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-lg"
              >
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="2" width="12" height="20" rx="6" />
                </svg>
              </button>
              <p className="text-sm text-gray-500">松手结束陈述</p>
              <p className="text-xs text-gray-400">已录制 {duration}s（最短 {minSpeech}s）</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">准备录音中...</p>
          )}
        </div>
      </div>
    )
  }

  if (step === 'evaluating') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-gray-500">AI 正在评估您的陈述...</p>
      </div>
    )
  }

  if (step === 'result' && result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">陈述评估结果</h2>

        {/* Total score */}
        <div className="flex justify-center mb-6">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
              <circle
                cx="56" cy="56" r="48"
                stroke="#22c55e" strokeWidth="10" fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - result.totalScore / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{result.totalScore}</span>
            </div>
          </div>
        </div>

        {/* Dimension scores */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: '语法', score: result.grammarScore, pct: 25 },
            { label: '内容', score: result.contentScore, pct: 25 },
            { label: '流利度', score: result.fluencyScore, pct: 25 },
            { label: '发音', score: result.pronunciationScore, pct: 25 },
          ].map((dim) => (
            <div key={dim.label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">{dim.label} ({dim.pct}%)</div>
              <div className="text-lg font-bold text-gray-900">{dim.score}</div>
            </div>
          ))}
        </div>

        {/* ASR text */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="text-xs text-blue-600 mb-1">识别文本</div>
          <div className="text-sm text-gray-700">{result.asrText}</div>
        </div>

        {/* Comment */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-xs text-gray-500 mb-1">AI 评语</div>
          <div className="text-sm text-gray-700 leading-relaxed">{result.comment}</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            再来一次
          </button>
          <button
            onClick={handleReset}
            className="py-2.5 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            返回话题列表
          </button>
        </div>
      </div>
    )
  }

  // Default: topic selection
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">话题陈述</h1>
      <p className="text-sm text-gray-500 mb-6">选择一个话题，准备 30 秒后进行 1-2 分钟的英文陈述</p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setCategory(''); setSelectedTopic(null) }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部话题
        </button>
        {Object.entries(SPEECH_CATEGORIES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Topic cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => handleSelectTopic(topic)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{topic.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                topic.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
                topic.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {SPEECH_DIFFICULTY_LABELS[topic.difficulty] || topic.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{topic.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{SPEECH_CATEGORIES[topic.category] || topic.category}</span>
              <span>准备 {topic.preparationSeconds}s</span>
              <span>陈述 {topic.speechSecondsMin}-{topic.speechSecondsMax}s</span>
            </div>
          </div>
        ))}
      </div>

      {toast && <Toast visible={true} message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
