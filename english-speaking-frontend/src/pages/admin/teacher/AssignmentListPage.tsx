/**
 * 作业管理页 — 作业列表 + 创建
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMyClasses,
  getAssignments,
  createAssignment,
  type ClassInfo,
  type Assignment,
} from '../../../api/admin'

const TYPE_LABELS: Record<string, string> = {
  PRONOUNCE: '跟读练习',
  CONVERSATION: '情景对话',
  GRAMMAR: '语法练习',
}

export default function AssignmentListPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<number>(0)
  const [title, setTitle] = useState('')
  const [aType, setAType] = useState('PRONOUNCE')
  const [desc, setDesc] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cls, asgn] = await Promise.all([getMyClasses(), getAssignments()])
      setClasses(cls)
      setAssignments(asgn)
    } catch { setMsg('加载失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!selectedClass || !title.trim()) return setMsg('请填写完整信息')
    try {
      await createAssignment({ classId: selectedClass, title, assignmentType: aType, description: desc })
      setMsg('作业创建成功')
      setShowModal(false)
      setTitle('')
      setDesc('')
      load()
    } catch { setMsg('操作失败') }
  }

  if (loading) return <p className="text-gray-400">加载中...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">作业管理</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          布置作业
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 mb-3">{msg}</p>}

      {assignments.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无作业</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id} onClick={() => navigate(`/admin/teacher/assignments/${a.id}`)}
                 className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {TYPE_LABELS[a.assignmentType] || a.assignmentType} · 已提交 {a.submitCount}人 · {a.status === 'PUBLISHED' ? '已发布' : a.status}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{a.createdAt?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建作业弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">布置作业</h3>
            <select value={selectedClass} onChange={(e) => setSelectedClass(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
              <option value={0}>选择班级</option>
              {classes.filter(c => c.status === 'ACTIVE').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2" placeholder="作业标题" />
            <select value={aType} onChange={(e) => setAType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
              <option value="PRONOUNCE">跟读练习</option>
              <option value="CONVERSATION">情景对话</option>
              <option value="GRAMMAR">语法练习</option>
            </select>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3" placeholder="作业说明（可选）" rows={2} />
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 border rounded-lg text-sm">取消</button>
              <button onClick={handleCreate}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
