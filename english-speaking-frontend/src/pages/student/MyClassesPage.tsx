/**
 * 学生端 — 我的班级 + 作业列表 + 加入班级
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../api/client'
import type { ClassInfo, Assignment } from '../../api/admin'

const TYPE_LABELS: Record<string, string> = {
  PRONOUNCE: '跟读练习',
  CONVERSATION: '情景对话',
  GRAMMAR: '语法练习',
}

const TYPE_COLORS: Record<string, string> = {
  PRONOUNCE: 'bg-blue-50 text-blue-600',
  CONVERSATION: 'bg-purple-50 text-purple-600',
  GRAMMAR: 'bg-green-50 text-green-600',
}

export default function MyClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [submitText, setSubmitText] = useState('')
  const [showSubmit, setShowSubmit] = useState<number | null>(null)
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set())
  const [mySubmissions, setMySubmissions] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cls, asgn, subs] = await Promise.all([
        request<ClassInfo[]>({ method: 'GET', url: '/user/class/my' }),
        request<Assignment[]>({ method: 'GET', url: '/user/class/assignments' }),
        request<any[]>({ method: 'GET', url: '/user/class/submissions' }),
      ])
      setClasses(cls)
      setAssignments(asgn)
      setMySubmissions(subs || [])
      setSubmittedIds(new Set((subs || []).map((s: any) => s.assignmentId)))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmitText = async (assignmentId: number) => {
    if (!submitText.trim()) return
    setSubmitting(assignmentId)
    try {
      await request({ method: 'POST', url: `/user/class/assignments/${assignmentId}/submit`, data: { text: submitText } })
      setSubmittedIds(prev => new Set(prev).add(assignmentId))
      setShowSubmit(null)
      setSubmitText('')
    } catch (e: any) {
      if (e?.message?.includes('已提交')) {
        setSubmittedIds(prev => new Set(prev).add(assignmentId))
        setShowSubmit(null)
      } else {
        alert(e?.message || '提交失败')
      }
    } finally {
      setSubmitting(null)
    }
  }

  const handleStartAssignment = (a: Assignment) => {
    if (a.assignmentType === 'CONVERSATION') {
      navigate(`/student/assignment/${a.id}/conversation`)
    } else if (a.assignmentType === 'PRONOUNCE') {
      navigate(`/student/assignment/${a.id}/pronounce`)
    } else {
      // GRAMMAR 或未知类型：弹出文本框
      setShowSubmit(a.id)
      setSubmitText('')
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) return setMsg('请输入邀请码')
    setJoining(true)
    setMsg('')
    try {
      await request({ method: 'POST', url: '/user/class/join', data: { inviteCode: code.trim().toUpperCase() } })
      setMsg('')
      setCode('')
      load()
    } catch (e: any) {
      setMsg(e?.message || '加入失败，请检查邀请码')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-500 text-lg">←</button>
        <h1 className="text-lg font-semibold text-gray-900">我的班级</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* 加入班级 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">加入班级</h2>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono tracking-wider text-center"
              placeholder="输入邀请码"
              maxLength={8}
            />
            <button onClick={handleJoin} disabled={joining}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {joining ? '加入中' : '加入'}
            </button>
          </div>
          {msg && <p className="text-xs text-red-500 mt-2">{msg}</p>}
        </div>

        {/* 已加入班级 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            已加入的班级{classes.length > 0 && <span className="text-gray-400 font-normal text-sm ml-1">({classes.length})</span>}
          </h2>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">还没有加入班级，输入上方邀请码加入</p>
          ) : (
            <div className="space-y-1">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.studentCount}人</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 作业列表 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            我的作业{assignments.length > 0 && <span className="text-gray-400 font-normal text-sm ml-1">({assignments.length})</span>}
          </h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {classes.length === 0 ? '请先加入班级' : '老师还没有发布作业'}
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const className = classes.find(c => c.id === a.classId)?.name || '未知班级'
                const isConversation = a.assignmentType === 'CONVERSATION'
                const isPronounce = a.assignmentType === 'PRONOUNCE'
                const isVoiceType = isConversation || isPronounce
                return (
                  <div key={a.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[a.assignmentType] || 'bg-gray-50 text-gray-600'}`}>
                        {TYPE_LABELS[a.assignmentType] || a.assignmentType}
                      </span>
                      <span className="text-xs text-gray-400">{a.createdAt?.slice(0, 10)}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{a.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{className} · 已提交{a.submitCount}人</p>
                    {a.description && <p className="text-xs text-gray-500 mt-1">{a.description}</p>}
                    {isVoiceType && a.difficulty && (
                      <p className="text-xs text-gray-400 mt-1">
                        难度: {a.difficulty === 'EASY' ? '简单' : a.difficulty === 'HARD' ? '困难' : '中等'}
                        {isConversation && a.requiredRounds ? ` · ${a.requiredRounds}轮` : ''}
                      </p>
                    )}
                    {submittedIds.has(a.id) ? (
                      <span className="inline-block mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">已提交</span>
                    ) : (
                      <button
                        onClick={() => isVoiceType ? handleStartAssignment(a) : setShowSubmit(a.id)}
                        className={`mt-2 text-xs text-white px-3 py-1 rounded hover:opacity-90 ${isVoiceType ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {isConversation ? '开始练习' : isPronounce ? '开始跟读' : '提交作业'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 提交记录和点评 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            我的提交{mySubmissions.length > 0 && <span className="text-gray-400 font-normal text-sm ml-1">({mySubmissions.length})</span>}
          </h2>
          {mySubmissions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无提交记录</p>
          ) : (
            <div className="space-y-3">
              {mySubmissions.map((s: any) => (
                <div key={s.submissionId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{s.assignmentTitle}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[s.assignmentType] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[s.assignmentType] || s.assignmentType}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        {s.status === 'REVIEWED' ? '已批改' : '已提交'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{s.submittedAt?.slice(0, 10)}</span>
                  </div>
                  {s.score != null && (
                    <p className="text-xs text-gray-500 mt-1">AI评分: {s.score}</p>
                  )}
                  {s.content && (
                    <p className="text-xs text-gray-500 mt-1">{s.content?.slice(0, 80)}{(s.content?.length > 80) ? '...' : ''}</p>
                  )}
                  {s.status === 'REVIEWED' && (
                    <div className="mt-2 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-blue-700 font-medium">教师评分: {s.teacherScore}分</span>
                        {s.score != null && <span className="text-xs text-gray-400">AI评分: {s.score}</span>}
                      </div>
                      {s.teacherReview && (
                        <p className="text-sm text-blue-800 mt-1">💬 {s.teacherReview}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 提交作业弹窗（仅 GRAMMAR 类型使用） */}
      {showSubmit !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">提交作业</h3>
            <textarea
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
              placeholder="输入你的作业内容..."
              rows={4}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSubmit(null)}
                className="flex-1 py-2 border rounded-lg text-sm">取消</button>
              <button onClick={() => handleSubmitText(showSubmit!)}
                disabled={submitting === showSubmit}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                {submitting === showSubmit ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
