/**
 * 作业跟读练习页 — 学生完成 PRONOUNCE 类型作业
 * 支持单句和多句（contentIds）模式
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecorder } from '../../hooks/useRecorder'
import { getContentList, evaluatePronunciation } from '../../api/practice'
import { getStudentAssignmentDetail, submitAssignmentPronounce } from '../../api/admin'
import type { ContentSentence, PronounceEvalResult } from '../../types/practice'
import type { Assignment } from '../../api/admin'
import { formatDuration } from '../../utils/format'
import Skeleton from '../../components/ui/Skeleton'

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '初级', intermediate: '中级', advanced: '高级',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-500'
}

// ============ 主页面 ============

const AssignmentPronouncePage = () => {
  const navigate = useNavigate()
  const { assignmentId } = useParams<{ assignmentId: string }>()

  const [loadingConfig, setLoadingConfig] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const allSentencesRef = useRef<ContentSentence[]>([])
  const [assignedSentences, setAssignedSentences] = useState<ContentSentence[]>([])
  const [currentSentence, setCurrentSentence] = useState<ContentSentence | null>(null)

  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'result' | 'error'>('idle')
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [result, setResult] = useState<PronounceEvalResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // 记录每句的练习结果: sentenceId → { recordId, totalScore }
  const [sentenceResults, setSentenceResults] = useState<Record<number, { recordId: number; score: number }>>({})

  const { duration, error: recorderError, startRecording, stopRecording, reset: resetRecorder } = useRecorder()
  const durationRef = useRef(0)
  useEffect(() => { durationRef.current = duration }, [duration])

  // ===================== 加载作业配置 =====================
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoadingConfig(true)
      setConfigError(null)
      try {
        const assgn = await getStudentAssignmentDetail(Number(assignmentId))
        if (cancelled) return

        if (assgn.assignmentType !== 'PRONOUNCE') {
          setConfigError('此作业不是跟读类型'); setLoadingConfig(false); return
        }
        setAssignment(assgn)

        const allSents = await getContentList()
        allSentencesRef.current = allSents

        // 确定分配的句子列表
        const ids = assgn.contentIds
          ? assgn.contentIds.split(',').map(Number).filter(Boolean)
          : assgn.contentId ? [assgn.contentId] : []

        if (ids.length === 0) {
          setConfigError('作业未指定跟读句子，请联系老师重新布置')
          setLoadingConfig(false)
          return
        }

        const assigned = ids.map(id => allSents.find(s => s.id === id)).filter(Boolean) as ContentSentence[]
        if (assigned.length === 0) {
          setConfigError('未找到作业指定的跟读内容')
          setLoadingConfig(false)
          return
        }

        setAssignedSentences(assigned)
        setCurrentSentence(assigned[0])
        setLoadingConfig(false)
      } catch (err: any) {
        if (!cancelled) { setConfigError(err?.message || '加载失败'); setLoadingConfig(false) }
      }
    }
    init()
    return () => { cancelled = true }
  }, [assignmentId])

  // 监听录音器错误
  useEffect(() => {
    if (recorderError) { setPracticeError(recorderError); setStatus('error') }
  }, [recorderError])

  // 播放示范音
  const playDemo = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'; utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }, [])

  // ===================== 选择句子 =====================
  const selectSentence = (s: ContentSentence) => {
    if (status === 'uploading') return
    setCurrentSentence(s)
    setResult(null)
    setPracticeError(null)
    setStatus('idle')
    resetRecorder()
  }

  // ===================== 录音交互 =====================
  const handlePointerDown = useCallback(async () => {
    if (status === 'uploading' || status === 'result') return
    setPracticeError(null); setStatus('recording')
    await startRecording()
  }, [status, startRecording])

  const handlePointerUp = useCallback(async () => {
    if (status !== 'recording') return
    const blob = await stopRecording()
    if (!blob || !currentSentence) return

    if (blob.size > 5 * 1024 * 1024) {
      setPracticeError('录音文件过大'); setStatus('error'); return
    }

    setStatus('uploading'); setPracticeError(null)
    try {
      const evalResult = await evaluatePronunciation(blob, currentSentence.id, durationRef.current)
      setResult(evalResult)
      setSentenceResults(prev => ({
        ...prev,
        [currentSentence.id]: { recordId: evalResult.recordId, score: evalResult.totalScore },
      }))
      setStatus('result')
    } catch (err: any) {
      setPracticeError(err?.message || '评测服务繁忙'); setStatus('error')
    }
  }, [status, stopRecording, currentSentence])

  // ===================== 提交作业 =====================
  const handleSubmit = useCallback(async () => {
    if (!result || !assignment) return
    setSubmitting(true)
    try {
      await submitAssignmentPronounce(assignment.id, result.recordId)
      navigate('/my-classes', { replace: true })
    } catch (err: any) {
      alert(err?.message || '提交失败')
    } finally { setSubmitting(false) }
  }, [result, assignment, navigate])

  const handleRetry = useCallback(() => {
    resetRecorder(); setPracticeError(null); setResult(null); setStatus('idle')
  }, [resetRecorder])

  // ===================== 渲染 =====================
  if (loadingConfig) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <Skeleton variant="text" width={200} height={20} />
        <Skeleton variant="text" width={300} height={48} />
        {[1, 2, 3].map(i => <Skeleton key={i} variant="text" width="100%" height={28} />)}
      </div>
    )
  }

  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm mb-4">{configError}</p>
        <button onClick={() => navigate('/my-classes')} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm">返回作业列表</button>
      </div>
    )
  }

  const completedCount = Object.keys(sentenceResults).length
  const hasMultipleSentences = assignedSentences.length > 1

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* 顶栏 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/my-classes')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">跟读作业</h1>
          <p className="text-xs text-gray-400">{assignment?.title}{hasMultipleSentences ? ` · ${completedCount}/${assignedSentences.length} 已完成` : ''}</p>
        </div>
      </div>

      {/* 多句模式：句子列表 */}
      {hasMultipleSentences && (
        <div className="mb-4 space-y-1">
          <p className="text-xs text-gray-500 mb-2">选择句子进行跟读练习：</p>
          {assignedSentences.map(s => {
            const sr = sentenceResults[s.id]
            const isActive = currentSentence?.id === s.id
            return (
              <button key={s.id}
                onClick={() => selectSentence(s)}
                disabled={status === 'uploading'}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-colors
                  ${isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
                  ${status === 'uploading' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0
                    ${sr ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {sr ? '✓' : '○'}
                  </span>
                  <span className="text-gray-700 flex-1">{s.sentence}</span>
                  {sr && <span className={`text-xs font-semibold ${getScoreColor(sr.score)}`}>{sr.score}分</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* 当前句子展示区 */}
      {currentSentence && (
        <div className={`rounded-xl border p-6 mb-6 ${status === 'result' && result ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">参考文本</p>
              <p className="text-lg md:text-xl font-medium text-gray-900 leading-relaxed">{currentSentence.sentence}</p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600">
                {DIFFICULTY_LABEL[currentSentence.difficulty] || currentSentence.difficulty}
              </span>
            </div>
            <button onClick={() => playDemo(currentSentence.sentence)}
              disabled={status === 'recording' || status === 'uploading'}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l5.4-3.9c.5-.3 1.1-.1 1.4.4.1.2.2.4.2.7v12c0 .6-.4 1-1 1-.3 0-.6-.1-.8-.3l-5.2-3.9H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.5z" />
              </svg>
              示范音
            </button>
          </div>

          {/* 评测结果 */}
          {status === 'result' && result && (
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <p className="text-sm text-gray-500 mb-3">识别结果：<span className="text-gray-800 font-medium">{result.asrText}</span></p>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-4xl font-extrabold ${getScoreColor(result.totalScore)}`}>{result.totalScore}</div>
                  <div className="text-xs text-gray-400 mt-1">总分</div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {[
                    { label: '准确度', score: result.accuracyScore },
                    { label: '流利度', score: result.fluencyScore },
                    { label: '完整度', score: result.completenessScore },
                    { label: '重音', score: result.stressScore },
                    { label: '语调', score: result.intonationScore },
                  ].filter(d => d.score != null).map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">{d.label}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: d.score! >= 80 ? '#10B981' : d.score! >= 60 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span className="text-xs font-medium w-7 text-right">{d.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 逐词颜色 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {result.wordResults.map((w, i) => (
                  <span key={i} className={`text-sm px-2 py-1 rounded-lg border font-medium
                    ${w.color === 'green' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : w.color === 'yellow' ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-red-600 bg-red-50 border-red-200'}`}>
                    {w.word}<span className="ml-1 text-xs opacity-70">{w.score}</span>
                  </span>
                ))}
              </div>

              {result.comment && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{result.comment}</p>}
            </div>
          )}
        </div>
      )}

      {/* 录音 / 提交按钮 */}
      <div className="flex flex-col items-center gap-4 py-4">
        {(status === 'idle' || status === 'recording') && (
          <>
            <button
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-20 h-20 rounded-full flex items-center justify-center select-none touch-none transition-all duration-200 outline-none
                ${status === 'recording'
                  ? 'bg-red-500 border-4 border-red-600 shadow-lg shadow-red-200 animate-recording-pulse active:scale-95'
                  : 'bg-white border-4 border-red-400 hover:border-red-500 hover:shadow-md active:scale-95'}`}>
              <svg className={`w-8 h-8 transition-colors ${status === 'recording' ? 'text-white' : 'text-red-500'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </button>
            {status === 'recording' ? (
              <>
                <span className="text-sm font-mono text-red-500 font-medium">{formatDuration(duration)}</span>
                <span className="text-xs text-red-400">松手结束录音</span>
              </>
            ) : (
              <p className="text-sm text-gray-500">长按按钮开始录音，松手结束</p>
            )}
          </>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">正在评测...</span>
          </div>
        )}

        {status === 'result' && (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <button onClick={handleRetry}
              className="w-full py-3 text-sm font-semibold text-teal-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
              再练一次
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              {submitting ? '提交中...' : '提交作业'}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-red-600">{practiceError}</p>
            <button onClick={handleRetry} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">重试</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignmentPronouncePage
