/**
 * 班级详情页 — 邀请码 + 学生列表 + 移除学生
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClassDetail, getClassStudents, removeStudent, type ClassInfo, type ClassStudent } from '../../../api/admin'

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [info, setInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [classInfo, studentList] = await Promise.all([
        getClassDetail(Number(id)),
        getClassStudents(Number(id)),
      ])
      setInfo(classInfo)
      setStudents(studentList)
    } catch { /* handled */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleRemove = async (studentId: number) => {
    if (!confirm('确定移除此学生？')) return
    try {
      await removeStudent(Number(id), studentId)
      load()
    } catch { alert('操作失败') }
  }

  const handleCopyCode = () => {
    if (!info?.inviteCode) return
    navigator.clipboard.writeText(info.inviteCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return <p className="text-gray-400">加载中...</p>
  if (!info) return <p className="text-gray-400">班级不存在</p>

  return (
    <div>
      <button onClick={() => navigate('/admin/teacher/classes')} className="text-sm text-gray-500 mb-4 block">← 返回班级列表</button>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{info.name}</h2>
        {info.description && <p className="text-sm text-gray-500 mt-1">{info.description}</p>}
        <p className="text-xs text-gray-400 mt-2">学生人数：{info.studentCount}/{info.maxStudents}</p>

        {/* 邀请码 — 醒目展示 */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-medium">班级邀请码</p>
            <p className="text-2xl font-mono font-bold text-blue-700 tracking-widest mt-1">{info.inviteCode}</p>
            <p className="text-xs text-blue-400 mt-1">将此邀请码分享给学生即可加入班级</p>
          </div>
          <button
            onClick={handleCopyCode}
            className={`px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {copied ? '已复制 ✓' : '复制'}
          </button>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mb-3">学生列表（{students.length}人）</h3>
      {students.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无学生加入，分享邀请码邀请学生吧</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-900 font-medium">{s.nickname || s.email || '未知'}</span>
                <span className="text-xs text-gray-400 ml-2">{s.level || s.cefrLevel || ''}</span>
              </div>
              <button onClick={() => handleRemove(s.id)} className="text-xs text-red-500 hover:underline">移除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
