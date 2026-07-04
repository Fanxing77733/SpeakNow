/**
 * 作业详情页 — 提交报告（谁交了谁没交）
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAssignmentReport, reviewSubmission, type AssignmentReport } from '../../../api/admin'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<AssignmentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewScore, setReviewScore] = useState(80)
  const [localReviews, setLocalReviews] = useState<Record<number, { score: number; review: string }>>({})

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

  return (
    <div>
      <button onClick={() => navigate('/admin/teacher/assignments')} className="text-sm text-gray-500 mb-4 block">← 返回作业列表</button>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{assignment.title}</h2>
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

                {s.submitted && s.content && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                    {s.content.length > 100 ? s.content.slice(0, 100) + '...' : s.content}
                  </p>
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
