/**
 * 班级管理页 — 班级列表 + 创建/编辑/解散
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMyClasses,
  createClass,
  updateClass,
  disbandClass,
  regenerateCode,
  type ClassInfo,
} from '../../../api/admin'

export default function ClassListPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<ClassInfo | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setClasses(await getMyClasses())
    } catch {
      setMsg('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditTarget(null)
    setName('')
    setDesc('')
    setShowModal(true)
  }

  const openEdit = (c: ClassInfo) => {
    setEditTarget(c)
    setName(c.name)
    setDesc(c.description || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return setMsg('请输入班级名称')
    try {
      if (editTarget) {
        await updateClass(editTarget.id, { name, description: desc })
        setMsg('班级已更新')
      } else {
        await createClass({ name, description: desc })
        setMsg('班级创建成功')
      }
      setShowModal(false)
      load()
    } catch { setMsg('操作失败') }
  }

  const handleDisband = async (id: number) => {
    if (!confirm('确定解散此班级？')) return
    try {
      await disbandClass(id)
      load()
    } catch { setMsg('操作失败') }
  }

  const handleRegenCode = async (id: number) => {
    try {
      const code = await regenerateCode(id)
      alert('新邀请码：' + code)
      load()
    } catch { setMsg('操作失败') }
  }

  if (loading) return <p className="text-gray-400">加载中...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">班级管理</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          创建班级
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 mb-3">{msg}</p>}

      {classes.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无班级，点击上方按钮创建</p>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status === 'ACTIVE' ? '正常' : '已解散'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  邀请码：{c.inviteCode} · 学生：{c.studentCount}/{c.maxStudents}
                </p>
              </div>
              <div className="flex gap-2 ml-3 shrink-0">
                <button onClick={() => navigate(`/admin/teacher/classes/${c.id}`)}
                  className="text-xs text-blue-600 hover:underline">详情</button>
                <button onClick={() => openEdit(c)}
                  className="text-xs text-gray-600 hover:underline">编辑</button>
                <button onClick={() => handleRegenCode(c.id)}
                  className="text-xs text-gray-600 hover:underline">换码</button>
                <button onClick={() => handleDisband(c.id)}
                  className="text-xs text-red-500 hover:underline">解散</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">{editTarget ? '编辑班级' : '创建班级'}</h3>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2" placeholder="班级名称" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3" placeholder="班级描述（可选）" rows={3} />
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 border rounded-lg text-sm">取消</button>
              <button onClick={handleSave}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
