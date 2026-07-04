/**
 * 内容审核页 — 审核队列 + 通过/驳回
 */
import { useState, useCallback, useEffect } from 'react'
import { getReviewQueue, reviewContent, type ReviewItem } from '../../../api/admin'

const TYPE_LABELS: Record<string, string> = {
  GROUP_POST: '小组帖子',
  GROUP_COMMENT: '小组评论',
  PEER_REVIEW: '互评内容',
  CHALLENGE_SUBMISSION: '挑战提交',
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setPage(p)
    try {
      const res = await getReviewQueue({ status: statusFilter || undefined, page: p, size: 20 })
      setItems(res.records)
      setTotal(res.total)
    } catch { setMsg('加载失败') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleAction = async (id: number, action: string) => {
    try {
      await reviewContent(id, { action })
      setMsg(action === 'APPROVE' ? '已通过' : action === 'REJECT' ? '已驳回' : '已跳过')
      load(page)
    } catch { setMsg('操作失败') }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">内容审核</h2>

      <div className="flex gap-2 mb-4">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              statusFilter === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'
            }`}>
            {s === 'PENDING' ? '待审核' : s === 'APPROVED' ? '已通过' : '已驳回'}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-blue-600 mb-3">{msg}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">加载中...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无审核内容</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-2">
                      {TYPE_LABELS[item.contentType] || item.contentType}
                    </span>
                    <span className="text-xs text-gray-400">
                      作者: {item.userNickname || `ID:${item.userId}`}
                    </span>
                  </div>
                  {item.aiScore != null && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      item.aiScore > 0.7 ? 'bg-red-100 text-red-700' :
                      item.aiScore > 0.3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      AI风险: {item.aiScore.toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">
                  {item.contentText || '(无文本内容)'}
                </p>

                {item.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(item.id, 'APPROVE')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">通过</button>
                    <button onClick={() => handleAction(item.id, 'REJECT')}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">驳回</button>
                    <button onClick={() => handleAction(item.id, 'SKIP')}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">跳过</button>
                  </div>
                )}

                {item.status !== 'PENDING' && (
                  <span className={`text-xs ${item.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.status === 'APPROVED' ? '✓ 已通过' : item.status === 'REJECTED' ? '✗ 已驳回' : '已跳过'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => load(p)}
                  className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
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
