/**
 * 用户管理页 — 搜索 + 封禁/解封
 */
import { useState, useCallback, useEffect } from 'react'
import { searchUsers, banUser, unbanUser, type UserInfo } from '../../../api/admin'

export default function UserManagePage() {
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState<UserInfo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const search = useCallback(async (p = 1, kw?: string) => {
    setLoading(true)
    setPage(p)
    try {
      const res = await searchUsers({ keyword: (kw ?? keyword) || undefined, page: p, size: 20 })
      setUsers(res.records)
      setTotal(res.total)
    } catch { setMsg('搜索失败') }
    finally { setLoading(false) }
  }, [keyword])

  // 首次自动加载
  useEffect(() => { search(1, '') }, [])

  const handleBan = async (userId: number) => {
    if (!confirm('确定封禁此用户？')) return
    try {
      await banUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u))
    } catch {
      alert('操作失败，请重试')
    }
  }

  const handleUnban = async (userId: number) => {
    try {
      await unbanUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
    } catch {
      alert('操作失败，请重试')
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">用户管理</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
          placeholder="搜索邮箱/手机号/昵称"
        />
        <button onClick={() => search()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">
          搜索
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 mb-3">{msg}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">加载中...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无数据</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 text-xs text-gray-500">ID</th>
                  <th className="px-4 py-2 text-xs text-gray-500">昵称/邮箱</th>
                  <th className="px-4 py-2 text-xs text-gray-500">角色</th>
                  <th className="px-4 py-2 text-xs text-gray-500">水平</th>
                  <th className="px-4 py-2 text-xs text-gray-500">状态</th>
                  <th className="px-4 py-2 text-xs text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5 text-gray-500">{u.id}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-gray-900">{u.nickname || '-'}</span>
                      <span className="text-gray-400 ml-1 text-xs">{u.email || u.phone || ''}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${u.role === 'TEACHER' ? 'bg-purple-100 text-purple-700' : u.role === 'OPERATOR' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role || ''] || u.role || 'LEARNER'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{u.level || u.cefrLevel || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs ${u.status === 'banned' ? 'text-red-600' : u.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {STATUS_LABELS[u.status || ''] || u.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {u.status === 'banned' ? (
                        <button onClick={() => handleUnban(u.id)} className="text-xs text-green-600 hover:underline">解封</button>
                      ) : (
                        <button onClick={() => handleBan(u.id)} className="text-xs text-red-500 hover:underline">封禁</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => search(p)}
                  className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  LEARNER: '学生',
  TEACHER: '教师',
  OPERATOR: '运营',
  ADMIN: '管理员',
}

const STATUS_LABELS: Record<string, string> = {
  active: '正常',
  banned: '已封禁',
  locked: '已锁定',
  deleted: '已注销',
}
