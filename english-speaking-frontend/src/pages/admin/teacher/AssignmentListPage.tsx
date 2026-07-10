/**
 * 作业管理页 — 作业列表 + 创建
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMyClasses, getAssignments, createAssignment,
  type ClassInfo, type Assignment,
} from '../../../api/admin'
import { getScenes } from '../../../api/roleplay'
import { getContentList } from '../../../api/practice'
import type { RoleplayScene } from '../../../types/conversation'
import type { ContentSentence } from '../../../types/practice'

const TYPE_LABELS: Record<string, string> = {
  PRONOUNCE: '跟读练习', CONVERSATION: '情景对话', GRAMMAR: '语法练习',
}

export default function AssignmentListPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [scenes, setScenes] = useState<RoleplayScene[]>([])
  const [sentences, setSentences] = useState<ContentSentence[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<number>(0)
  const [title, setTitle] = useState('')
  const [aType, setAType] = useState('PRONOUNCE')
  const [desc, setDesc] = useState('')
  const [contentId, setContentId] = useState<number>(0)
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(new Set())
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [requiredRounds, setRequiredRounds] = useState(5)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cls, asgn, sc, sents] = await Promise.all([
        getMyClasses(), getAssignments(), getScenes(), getContentList(),
      ])
      setClasses(cls); setAssignments(asgn); setScenes(sc); setSentences(sents)
    } catch { setMsg('加载失败') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!selectedClass || !title.trim()) return setMsg('请填写完整信息')
    if (aType === 'PRONOUNCE' && selectedSentenceIds.size === 0) return setMsg('请选择至少一个跟读句子')
    if (aType === 'CONVERSATION' && !contentId) return setMsg('请选择对话场景')
    try {
      await createAssignment({
        classId: selectedClass,
        title,
        assignmentType: aType,
        description: desc || undefined,
        contentId: aType === 'CONVERSATION' ? (contentId || undefined) : undefined,
        contentIds: aType === 'PRONOUNCE' && selectedSentenceIds.size > 0
          ? Array.from(selectedSentenceIds).join(',') : undefined,
        difficulty: (aType === 'CONVERSATION' || aType === 'PRONOUNCE') ? difficulty : undefined,
        requiredRounds: aType === 'CONVERSATION' ? requiredRounds : undefined,
      })
      setShowModal(false)
      setTitle(''); setDesc(''); setContentId(0); setSelectedSentenceIds(new Set())
      setDifficulty('MEDIUM'); setRequiredRounds(5); setMsg('')
      load()
    } catch { setMsg('操作失败') }
  }

  const openModal = () => {
    setSelectedClass(0); setTitle(''); setAType('PRONOUNCE'); setDesc('')
    setContentId(0); setSelectedSentenceIds(new Set())
    setDifficulty('MEDIUM'); setRequiredRounds(5); setMsg('')
    setShowModal(true)
  }

  const isConversation = aType === 'CONVERSATION'
  const isPronounce = aType === 'PRONOUNCE'

  const toggleSentence = (id: number) => {
    setSelectedSentenceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (loading) return <p className="text-gray-400">加载中...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">作业管理</h2>
        <button onClick={openModal} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
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
                    {TYPE_LABELS[a.assignmentType] || a.assignmentType} · 已提交{a.submitCount}人
                    · {a.status === 'PUBLISHED' ? '已发布' : a.status}
                    {a.difficulty ? ` · ${a.difficulty === 'EASY' ? '简单' : a.difficulty === 'HARD' ? '困难' : '中等'}` : ''}
                    {a.contentIds ? ` · ${a.contentIds.split(',').length}句` : ''}
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
          <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
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

            <select value={aType} onChange={(e) => { setAType(e.target.value); setContentId(0); setSelectedSentenceIds(new Set()) }}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
              <option value="PRONOUNCE">跟读练习</option>
              <option value="CONVERSATION">情景对话</option>
              <option value="GRAMMAR">语法练习</option>
            </select>

            {/* CONVERSATION 专属 */}
            {isConversation && (
              <>
                <select value={contentId} onChange={(e) => setContentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
                  <option value={0}>选择对话场景</option>
                  {scenes.map(s => (
                    <option key={s.id} value={s.id}>{s.iconEmoji} {s.nameZh} ({s.difficulty})</option>
                  ))}
                </select>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
                  <option value="EASY">难度：简单</option>
                  <option value="MEDIUM">难度：中等</option>
                  <option value="HARD">难度：困难</option>
                </select>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">要求轮数:</span>
                  <input type="number" value={requiredRounds} min={3} max={15}
                    onChange={(e) => setRequiredRounds(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded text-sm text-center" />
                </div>
              </>
            )}

            {/* PRONOUNCE 专属 — 多选句子（全部展示） */}
            {isPronounce && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">
                  选择跟读句子（已选 {selectedSentenceIds.size} 句）
                </p>
                <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                  {sentences.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3 text-center">暂无句子</p>
                  ) : (
                    sentences.map(s => {
                      const checked = selectedSentenceIds.has(s.id)
                      return (
                        <label key={s.id}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${checked ? 'bg-blue-50' : ''}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleSentence(s.id)}
                            className="w-4 h-4 text-blue-600 rounded shrink-0" />
                          <span className="text-gray-700 leading-tight flex-1">{s.sentence}</span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {s.difficulty === 'beginner' ? '初级' : s.difficulty === 'intermediate' ? '中级' : '高级'}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3" placeholder="作业说明（可选）" rows={2} />

            {msg && <p className="text-xs text-red-500 mb-2">{msg}</p>}

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
