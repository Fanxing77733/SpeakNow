/**
 * 作业详情页 — 提交报告（谁交了谁没交）
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAssignmentReport, reviewSubmission, type AssignmentReport } from '../../../api/admin'

const TYPE_LABELS: Record<string, string> = {
  PRONOUNCE: '跟读练习',
  CONVERSATION: '情景对话',
  GRAMMAR: '语法练习',
}

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<AssignmentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewScore, setReviewScore] = useState(80)
  const [localReviews, setLocalReviews] = useState<Record<number, { score: number; review: string }>>({})
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setReport(await getAssignmentReport(Number(id)))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleReview = async (submissionId: number) => {
    if (!reviewText.trim()) return
    try {
      await reviewSubmission(Number(id)!, submissionId, {
        teacherReview: reviewText,
        teacherScore: reviewScore,
      })
      setLocalReviews(prev => ({ ...prev, [submissionId]: { score: reviewScore, review: reviewText } }))
      setReviewingId(null)
      setReviewText('')
      load()
    } catch { alert('点评失败') }
  }

  if (loading) return <p className="text-gray-400">加载中...</p>
  if (!report) return <p className="text-gray-400">作业不存在</p>

  const { assignment, students, submittedCount, totalStudents } = report
  const isConversation = assignment.assignmentType === 'CONVERSATION'

  return (
    <div>
      <button onClick={() => navigate('/admin/teacher/assignments')} className="text-sm text-gray-500 mb-4 block">← 返回作业列表</button>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{assignment.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
            {TYPE_LABELS[assignment.assignmentType] || assignment.assignmentType}
          </span>
          {assignment.difficulty && (
            <span className="text-xs text-gray-400">
              {assignment.difficulty === 'EASY' ? '简单' : assignment.difficulty === 'HARD' ? '困难' : '中等'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{assignment.description || ''}</p>
        <div className="flex gap-4 mt-3">
          <span className={`text-sm px-2 py-0.5 rounded ${
            submittedCount === totalStudents ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            已提交 {submittedCount}/{totalStudents}
          </span>
          {totalStudents === 0 && <span className="text-xs text-gray-400">暂无学生加入班级</span>}
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mb-3">学生提交情况</h3>

      {students.length === 0 ? (
        <p className="text-gray-400 text-sm">班级暂无学生</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const local = localReviews[s.submissionId || 0]
            const hasReview = local || s.teacherReview
            const isExpanded = expandedStudent === s.studentId
            return (
              <div key={s.studentId}
                className={`bg-white rounded-lg border p-4 ${s.submitted ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{s.nickname || s.email || '未知'}</span>
                    {s.submitted ? (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">已提交</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">未提交</span>
                    )}
                  </div>
                  {s.score != null && <span className="text-xs text-gray-500">AI评分: {s.score}</span>}
                </div>

                {/* 文本内容（语法类作业） */}
                {s.submitted && s.content && (
                  <div>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2 whitespace-pre-wrap">
                      {isExpanded ? s.content : (s.content.length > 100 ? s.content.slice(0, 100) + '...' : s.content)}
                    </p>
                    {s.content.length > 100 && (
                      <button onClick={() => setExpandedStudent(isExpanded ? null : s.studentId)}
                        className="text-xs text-blue-600 hover:underline mt-1">
                        {isExpanded ? '收起' : '展开全文'}
                      </button>
                    )}
                  </div>
                )}

                {/* CONVERSATION：显示对话逐轮记录 */}
                {s.submitted && isConversation && s.conversationMessages && s.conversationMessages.length > 0 && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">对话记录（{s.conversationMessages.length}条消息）</p>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {s.conversationMessages.map((m, i) => (
                        <div key={i} className={`text-xs ${m.role === 'ai' ? 'text-blue-700' : 'text-gray-700'}`}>
                          <span className="font-medium">{m.role === 'ai' ? 'AI' : '学生'} (第{m.round}轮):</span>{' '}
                          {m.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRONOUNCE：显示 AI 评测详情 */}
                {s.submitted && assignment.assignmentType === 'PRONOUNCE' && s.pronounceDetail && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">AI 评测详情</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: '准确度', score: s.pronounceDetail.accuracyScore },
                        { label: '流利度', score: s.pronounceDetail.fluencyScore },
                        { label: '完整度', score: s.pronounceDetail.completenessScore },
                        { label: '重音', score: s.pronounceDetail.stressScore },
                        { label: '语调', score: s.pronounceDetail.intonationScore },
                      ].filter(d => d.score != null).map(d => (
                        <div key={d.label} className="text-center bg-white rounded-lg p-2">
                          <div className={`text-lg font-bold ${d.score! >= 80 ? 'text-emerald-600' : d.score! >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                            {d.score}
                          </div>
                          <div className="text-xs text-gray-400">{d.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* 逐词评测结果 + AI 评语 */}
                    {s.pronounceDetail.evalDetailJson && (() => {
                      try {
                        const detail = JSON.parse(s.pronounceDetail.evalDetailJson)
                        return (
                          <div>
                            {/* 逐词颜色 */}
                            {detail.wordResults && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {(detail.wordResults as Array<{ word: string; score: number; color: string }>).map((w: any, i: number) => (
                                  <span key={i} className={`text-xs px-2 py-1 rounded-lg border font-medium
                                    ${w.color === 'green' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : w.color === 'yellow' ? 'text-amber-700 bg-amber-50 border-amber-200'
                                      : 'text-red-600 bg-red-50 border-red-200'}`}>
                                    {w.word}<span className="ml-1 opacity-60">{w.score}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* AI 综合评语 */}
                            {detail.comment && (
                              <div className="bg-white rounded-lg p-3 mb-2">
                                <p className="text-xs text-gray-400 mb-1">AI 点评</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{detail.comment}</p>
                              </div>
                            )}
                            {/* 优点 & 待改进 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {detail.strengths?.length > 0 && (
                                <div className="bg-emerald-50 rounded-lg p-2">
                                  <p className="text-xs font-medium text-emerald-600 mb-1">优点</p>
                                  <ul className="text-xs text-emerald-800 space-y-0.5">
                                    {(detail.strengths as string[]).map((s: string, i: number) => (
                                      <li key={i}>· {s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {detail.weaknesses?.length > 0 && (
                                <div className="bg-amber-50 rounded-lg p-2">
                                  <p className="text-xs font-medium text-amber-600 mb-1">待改进</p>
                                  <ul className="text-xs text-amber-800 space-y-0.5">
                                    {(detail.weaknesses as string[]).map((w: string, i: number) => (
                                      <li key={i}>· {w}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      } catch { /* ignore parse error */ }
                      return null
                    })()}
                    {s.pronounceDetail.durationSeconds != null && (
                      <p className="text-xs text-gray-400 mt-2">录音时长: {s.pronounceDetail.durationSeconds}秒</p>
                    )}
                  </div>
                )}

                {/* PRONOUNCE：显示音频链接（旧数据兼容） */}
                {s.submitted && assignment.assignmentType === 'PRONOUNCE' && s.audioUrl && !s.pronounceDetail && (
                  <div className="mt-2">
                    <audio controls src={s.audioUrl} className="w-full h-8" />
                  </div>
                )}

                {/* 教师点评区 */}
                {s.submitted && (
                  <div className="mt-2">
                    {hasReview ? (
                      <div className="text-xs bg-blue-50 rounded p-2">
                        <span className="text-blue-700 font-medium">评分: {local?.score || s.teacherScore}</span>
                        <span className="text-blue-600 ml-2">{local?.review || s.teacherReview}</span>
                      </div>
                    ) : reviewingId === s.submissionId ? (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">评分:</span>
                          <input type="number" value={reviewScore} min={0} max={100}
                            onChange={(e) => setReviewScore(Number(e.target.value))}
                            className="w-16 px-2 py-1 border rounded text-xs" />
                        </div>
                        <textarea value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded text-xs" placeholder="输入点评..."
                          rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => handleReview(s.submissionId!)}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded">确认</button>
                          <button onClick={() => setReviewingId(null)}
                            className="text-xs px-3 py-1 border rounded text-gray-600">取消</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setReviewingId(s.submissionId!); setReviewText(''); setReviewScore(80) }}
                        className="text-xs text-blue-600 hover:underline mt-1">
                        点评
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 统计 */}
      <div className="mt-4 text-xs text-gray-400">
        共 {totalStudents} 名学生，{submittedCount} 人已提交，{totalStudents - submittedCount} 人未提交
      </div>
    </div>
  )
}
