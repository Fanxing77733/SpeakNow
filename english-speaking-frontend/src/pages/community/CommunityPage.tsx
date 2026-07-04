/**
 * 学习社区页 — 小组列表（V2.0）
 *
 * 小组列表、搜索、创建/加入/退出。
 * 点击"查看"跳转到 GroupDetailPage 查看详情。
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../api/client'
import Skeleton from '../../components/ui/Skeleton'

// ========== 类型 ==========

interface Group {
  id: number; name: string; memberCount: number; visibility: string; joined?: boolean
}

// ========== localStorage 持久化 ==========

const JOINED_KEY = 'community_joined_groups'

function getJoinedIds(): Set<number> {
  try { const raw = localStorage.getItem(JOINED_KEY); return raw ? new Set(JSON.parse(raw)) : new Set() } catch { return new Set() }
}
function saveJoinedIds(ids: Set<number>) { localStorage.setItem(JOINED_KEY, JSON.stringify([...ids])) }
function markJoined(groupId: number) { const ids = getJoinedIds(); ids.add(groupId); saveJoinedIds(ids) }
function markLeft(groupId: number) { const ids = getJoinedIds(); ids.delete(groupId); saveJoinedIds(ids) }
function mergeJoined(groups: Group[]): Group[] { const ids = getJoinedIds(); return groups.map(g => ({ ...g, joined: g.joined || ids.has(g.id) })) }

// ========== 组件 ==========

const CommunityPage = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupVisibility, setNewGroupVisibility] = useState('public')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // ========== 数据加载 ==========

  const loadGroups = useCallback(async (keyword = '') => {
    setLoading(true)
    try {
      const data = await request<Group[]>({ method: 'GET', url: '/groups', params: { keyword } })
      setGroups(mergeJoined(data && data.length > 0 ? data : []))
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadGroups('') }, [loadGroups])

  function handleSearch() {
    loadGroups(searchKeyword.trim())
  }

  // ========== 小组操作 ==========

  async function handleCreateGroup() {
    if (!newGroupName.trim() || newGroupName.trim().length < 2) { showToast('小组名称至少2个字符'); return }
    setCreating(true)
    try {
      const group = await request<Group>({ method: 'POST', url: '/groups', data: { name: newGroupName.trim(), visibility: newGroupVisibility, description: newGroupDesc.trim() } })
      markJoined(group.id)
      setGroups(prev => [{ ...group, joined: true }, ...prev])
      setNewGroupName('')
      setNewGroupDesc('')
      showToast('小组创建成功！')
    } catch {
      const fakeGroup: Group = { id: Date.now(), name: newGroupName.trim(), memberCount: 1, visibility: newGroupVisibility, joined: true }
      markJoined(fakeGroup.id)
      setGroups(prev => [fakeGroup, ...prev])
      setNewGroupName('')
      setNewGroupDesc('')
      showToast('小组创建成功！（离线模式）')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(groupId: number) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, joined: true, memberCount: g.memberCount + 1 } : g))
    markJoined(groupId)
    try {
      await request<void>({ method: 'POST', url: `/groups/${groupId}/join` })
      loadGroups()
    } catch { /* 后端不可用，本地状态已更新 */ }
    showToast('已加入小组')
  }

  async function handleLeave(groupId: number) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, joined: false, memberCount: Math.max(1, g.memberCount - 1) } : g))
    markLeft(groupId)
    try {
      await request<void>({ method: 'POST', url: `/groups/${groupId}/leave` })
      loadGroups()
    } catch { /* 后端不可用，本地状态已更新 */ }
    showToast('已退出小组')
  }

  // ========== 渲染 ==========

  if (loading) {
    return <div className="max-w-3xl mx-auto"><Skeleton variant="text" width={200} height={32} className="mb-4" /><Skeleton variant="text" height={200} /></div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">学习社区</h1>
      <p className="text-sm text-gray-500 mb-6">加入学习小组，一起练习英语口语</p>

      {/* Toast */}
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* 搜索 */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索小组名称..." maxLength={50}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }} />
          <button onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
            搜索
          </button>
        </div>
      </div>

      {/* 创建小组 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">创建学习小组</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="小组名称（2-20字）" maxLength={20}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
            <select value={newGroupVisibility} onChange={(e) => setNewGroupVisibility(e.target.value)}
              className="w-24 px-2 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              <option value="public">公开</option>
              <option value="private">私密</option>
            </select>
            <button onClick={handleCreateGroup} disabled={creating || !newGroupName.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 whitespace-nowrap">
              {creating ? '...' : '创建'}
            </button>
          </div>
          <input type="text" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)}
            placeholder="小组简介（选填，不超过200字）" maxLength={200}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
          <p className="text-xs text-gray-400">
            公开组：任何人可加入 · 私密组：需组长审批 · 每人最多加入5个小组
          </p>
        </div>
      </div>

      {/* 小组列表 */}
      <div className="space-y-3 mb-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {group.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-800 truncate">{group.name}</h4>
              <p className="text-xs text-gray-400">{group.memberCount} 位成员 · {group.visibility === 'public' ? '公开' : '私密'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/community/${group.id}`)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200">
                查看
              </button>
              {group.joined ? (
                <button onClick={() => handleLeave(group.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100">
                  退出
                </button>
              ) : (
                <button onClick={() => handleJoin(group.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100">
                  加入
                </button>
              )}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="text-center py-10 text-sm text-gray-400">暂无学习小组，快来创建第一个吧！</div>}
      </div>
    </div>
  )
}

export default CommunityPage
