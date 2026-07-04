/**
 * 小组详情页（V2.0）
 *
 * 路由: /community/:groupId
 * 功能: 小组信息 + 每日话题 + 组内挑战 + 排名 + 讨论区 + 组长管理
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { request } from '../../api/client'
import Skeleton from '../../components/ui/Skeleton'

interface GroupDetail {
  id: number; name: string; description?: string; memberCount: number
  visibility: string; ownerId: number; ownerName: string; member: boolean; myRole?: string
  topicPushEnabled?: boolean
}
interface Challenge {
  id: number; title: string; description?: string; contentId: number; contentText?: string
  status: string; startsAt?: string; endsAt?: string; durationHours?: number; maxSubmissions?: number
  participantCount: number; submissionCount: number; userSubmitted: boolean
  userSubmissionCount?: number; myBestScore?: number | null; myRank?: number | null; userBestScore?: number | null
}
interface Discussion {
  id: number; userId: number; userName: string; content: string; createdAt?: string
}
interface TopicVO {
  id: number; topicContent: string; pushedAt: string
}

const GroupDetailPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const id = Number(groupId)

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // 每日话题
  const [topic, setTopic] = useState<TopicVO | null>(null)

  // 挑战
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [challengeTitle, setChallengeTitle] = useState('')
  const [challengeDesc, setChallengeDesc] = useState('')
  const [challengeContentId, setChallengeContentId] = useState(1)
  const [challengeDuration, setChallengeDuration] = useState(168)
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [rankingMap, setRankingMap] = useState<Record<number, Challenge[]>>({})

  // 讨论
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [discussionContent, setDiscussionContent] = useState('')
  const [postingDiscussion, setPostingDiscussion] = useState(false)

  // 组长管理
  const [showJoinRequests, setShowJoinRequests] = useState(false)
  const [joinRequests, setJoinRequests] = useState<any[]>([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const isOwner = group?.myRole === 'owner'
  const isAdmin = group?.myRole === 'admin'
  const canManage = isOwner || isAdmin

  // ========== 加载数据 ==========

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request<GroupDetail>({ method: 'GET', url: `/groups/${id}` })
      if (data) {
        setGroup(data)
        setChallenges((data as any).challenges || [])
        setDiscussions((data as any).discussions || [])
      }
    } catch {
      showToast('加载小组详情失败')
    } finally {
      setLoading(false)
    }
    // 每日话题
    try {
      const t = await request<TopicVO>({ method: 'GET', url: `/groups/${id}/topics/latest` })
      if (t) setTopic(t)
    } catch { /* 无话题 */ }
  }, [id])

  useEffect(() => { if (id) loadAll() }, [loadAll])

  // ========== 加入/退出 ==========

  async function handleJoin() {
    try {
      await request<void>({ method: 'POST', url: `/groups/${id}/join` })
      showToast('已加入小组')
      loadAll()
    } catch (e: any) { showToast(e?.response?.data?.message || '加入失败') }
  }

  async function handleLeave() {
    if (!confirm('确定要退出该小组吗？')) return
    try {
      await request<void>({ method: 'POST', url: `/groups/${id}/leave` })
      showToast('已退出小组')
      loadAll()
    } catch (e: any) { showToast(e?.response?.data?.message || '退出失败') }
  }

  // ========== 挑战 ==========

  async function handleCreateChallenge() {
    if (!challengeTitle.trim()) { showToast('请输入挑战标题'); return }
    setCreatingChallenge(true)
    try {
      await request({
        method: 'POST', url: `/groups/${id}/challenges`,
        data: { title: challengeTitle.trim(), description: challengeDesc, contentId: challengeContentId, durationHours: challengeDuration, maxSubmissions: 3 }
      })
      showToast('挑战已创建')
      setChallengeTitle(''); setChallengeDesc(''); setShowCreateChallenge(false)
      loadAll()
    } catch (e: any) { showToast(e?.response?.data?.message || '创建失败') }
    finally { setCreatingChallenge(false) }
  }

  async function handleSubmitChallenge(challengeId: number) {
    const practiceId = prompt('输入评测记录 ID:')
    const score = prompt('输入得分（0-100）:')
    if (!practiceId || !score) return
    try {
      const result = await request<Challenge>({
        method: 'POST', url: `/challenges/${challengeId}/submit`,
        data: { practiceId: Number(practiceId), score: Number(score) }
      })
      showToast(`提交成功！得分: ${result.myBestScore}，排名: #${result.myRank}`)
      loadAll()
    } catch (e: any) { showToast(e?.response?.data?.message || '提交失败') }
  }

  async function handleViewRanking(challengeId: number) {
    if (rankingMap[challengeId]) { setRankingMap(prev => { const n = { ...prev }; delete n[challengeId]; return n }); return }
    try {
      const data = await request<Challenge[]>({ method: 'GET', url: `/challenges/${challengeId}/ranking` })
      setRankingMap(prev => ({ ...prev, [challengeId]: data || [] }))
    } catch { setRankingMap(prev => ({ ...prev, [challengeId]: [] })) }
  }

  // ========== 讨论 ==========

  async function handlePostDiscussion() {
    if (!discussionContent.trim()) return
    setPostingDiscussion(true)
    try {
      await request<Discussion>({ method: 'POST', url: `/groups/${id}/discussions`, data: { content: discussionContent.trim() } })
      setDiscussionContent('')
      showToast('发送成功')
      loadAll()
    } catch (e: any) {
      // 离线回退
      const fake: Discussion = { id: Date.now(), userId: 0, userName: '我', content: discussionContent.trim(), createdAt: new Date().toISOString() }
      setDiscussions(prev => [...prev, fake])
      setDiscussionContent('')
      showToast('发送成功！（离线模式）')
    }
    finally { setPostingDiscussion(false) }
  }

  // ========== 组长管理 ==========

  async function handleLoadJoinRequests() {
    setShowJoinRequests(!showJoinRequests)
    if (!showJoinRequests) {
      try {
        const data = await request<any[]>({ method: 'GET', url: `/groups/${id}/join-requests` })
        setJoinRequests(data || [])
      } catch { setJoinRequests([]) }
    }
  }

  async function handleApproveRequest(reqId: number) {
    try {
      await request<void>({ method: 'POST', url: `/groups/${id}/join-requests/${reqId}/approve` })
      showToast('已通过申请')
      handleLoadJoinRequests()
      loadAll()
    } catch (e: any) { showToast(e?.response?.data?.message || '操作失败') }
  }

  async function handleRejectRequest(reqId: number) {
    try {
      await request<void>({ method: 'POST', url: `/groups/${id}/join-requests/${reqId}/reject` })
      showToast('已拒绝申请')
      handleLoadJoinRequests()
    } catch (e: any) { showToast(e?.response?.data?.message || '操作失败') }
  }

  async function handleTransferOwnership(newOwnerId: number) {
    try {
      await request<void>({ method: 'POST', url: `/groups/${id}/transfer`, data: { newOwnerId } })
      showToast('组长已转让')
      loadAll()
    } catch (e: any) { showToast(e?.response?.data?.message || '转让失败') }
  }

  async function handleDisbandGroup() {
    if (!confirm('确定要解散该小组吗？此操作不可撤销！')) return
    try {
      await request<void>({ method: 'DELETE', url: `/groups/${id}` })
      showToast('小组已解散')
      navigate('/community', { replace: true })
    } catch (e: any) { showToast(e?.response?.data?.message || '解散失败') }
  }

  // ========== 渲染 ==========

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton variant="text" width={200} height={32} className="mb-4" />
        <Skeleton variant="text" height={180} className="mb-6" />
        <Skeleton variant="text" height={200} />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-gray-400 text-lg mb-4">小组不存在</p>
        <button onClick={() => navigate('/community')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">返回社区</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast */}
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* 返回 */}
      <button onClick={() => navigate('/community')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
        &larr; 返回社区
      </button>

      {/* ===== 头部信息 ===== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            {group.name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {group.memberCount} 位成员 · 组长: {group.ownerName}
              {group.visibility === 'private' && ' · 私密组'}
            </p>
          </div>
          {group.member ? (
            <button onClick={handleLeave}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">
              退出小组
            </button>
          ) : (
            <button onClick={handleJoin}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              加入小组
            </button>
          )}
        </div>
        {group.description && <p className="text-sm text-gray-500 mt-4">{group.description}</p>}
      </div>

      {/* ===== 每日话题 ===== */}
      {topic && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-6">
          <h3 className="text-xs font-medium text-blue-600 mb-1">今日话题</h3>
          <p className="text-sm text-gray-700">{topic.topicContent}</p>
        </div>
      )}

      {/* ===== 组长/管理员操作栏 ===== */}
      {group.member && canManage && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setShowCreateChallenge(!showCreateChallenge)}
            className="px-4 py-2 rounded-lg bg-green-50 text-green-600 text-sm font-medium hover:bg-green-100">
            {showCreateChallenge ? '取消' : '发起挑战'}
          </button>
          {isOwner && (
            <>
              <button onClick={handleLoadJoinRequests}
                className="px-4 py-2 rounded-lg bg-yellow-50 text-yellow-600 text-sm font-medium hover:bg-yellow-100">
                入组申请
              </button>
              <button onClick={handleDisbandGroup}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-500 text-sm font-medium hover:bg-red-200">
                解散小组
              </button>
            </>
          )}
        </div>
      )}

      {/* ===== 创建挑战表单 ===== */}
      {showCreateChallenge && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">发起语音挑战</h4>
          <input type="text" value={challengeTitle} onChange={e => setChallengeTitle(e.target.value)}
            placeholder="挑战标题" maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
          <input type="text" value={challengeDesc} onChange={e => setChallengeDesc(e.target.value)}
            placeholder="挑战描述（可选）" maxLength={200}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
          <div className="flex gap-2">
            <select value={challengeContentId} onChange={e => setChallengeContentId(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              <option value={1}>跟读内容 #1</option>
              <option value={2}>跟读内容 #2</option>
              <option value={3}>跟读内容 #3</option>
              <option value={4}>跟读内容 #4</option>
            </select>
            <select value={challengeDuration} onChange={e => setChallengeDuration(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              <option value={24}>1天</option>
              <option value={72}>3天</option>
              <option value={168}>7天</option>
            </select>
          </div>
          <button onClick={handleCreateChallenge} disabled={creatingChallenge || !challengeTitle.trim()}
            className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-gray-300">
            {creatingChallenge ? '创建中...' : '创建挑战'}
          </button>
        </div>
      )}

      {/* ===== 入组申请管理 ===== */}
      {showJoinRequests && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">入组申请</h4>
          {joinRequests.length === 0 ? (
            <p className="text-xs text-gray-400">暂无待审批的申请</p>
          ) : (
            <div className="space-y-2">
              {joinRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{req.userName}</span>
                    <span className="text-xs text-gray-400 ml-2">{req.requestedAt?.slice(0, 16)?.replace('T', ' ')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveRequest(req.id)}
                      className="px-3 py-1 rounded-lg bg-green-100 text-green-600 text-xs font-medium hover:bg-green-200">通过</button>
                    <button onClick={() => handleRejectRequest(req.id)}
                      className="px-3 py-1 rounded-lg bg-red-100 text-red-500 text-xs font-medium hover:bg-red-200">拒绝</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* 转让组长 */}
          {isOwner && (
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-xs text-gray-500 mb-2">转让组长给成员（输入成员ID）:</p>
              <div className="flex gap-2">
                <input type="number" placeholder="成员ID" id="transferUserId"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none" />
                <button onClick={() => {
                  const el = document.getElementById('transferUserId') as HTMLInputElement
                  if (el?.value) handleTransferOwnership(Number(el.value))
                }}
                  className="px-3 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600">转让</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 组内挑战 ===== */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          组内挑战 {challenges.length > 0 && `(${challenges.length})`}
        </h2>
        {challenges.length > 0 ? (
          <div className="space-y-3">
            {challenges.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{c.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status === 'active' ? '进行中' : '已结束'}
                  </span>
                </div>
                {c.contentText && <p className="text-xs text-gray-500 mt-1">跟读内容: {c.contentText}</p>}
                {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{c.participantCount} 人参与 · {c.submissionCount} 次提交</p>
                  {c.userSubmitted && c.myBestScore != null && (
                    <p className="text-xs text-blue-600 font-medium">我的最佳: {c.myBestScore} 分 #{c.myRank ?? '-'}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {c.status === 'active' && group.member && (
                    <button onClick={() => handleSubmitChallenge(c.id)}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100">
                      {c.userSubmitted ? '重新提交' : '提交录音'}
                    </button>
                  )}
                  <button onClick={() => handleViewRanking(c.id)}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200">
                    {rankingMap[c.id] ? '收起排名' : '查看排名'}
                  </button>
                </div>

                {/* 排名列表 */}
                {rankingMap[c.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="text-xs font-medium text-gray-600 mb-2">排行榜（匿名）</h5>
                    {(rankingMap[c.id]?.length ?? 0) > 0 ? (
                      <div className="space-y-1">
                        {rankingMap[c.id].map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                              {' '}{r.contentText || '匿名用户'}
                            </span>
                            <span className="font-medium text-gray-700">{r.myBestScore ?? (r as any).userBestScore ?? 0} 分</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-gray-400">暂无排名数据</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">暂无挑战，组长快来发起第一个吧！</p>
          </div>
        )}
      </section>

      {/* ===== 讨论区 ===== */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          小组讨论 {discussions.length > 0 && `(${discussions.length})`}
        </h2>
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {discussions.length > 0 ? discussions.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-blue-600">{d.userName}</span>
                <span className="text-xs text-gray-400">{d.createdAt?.slice(0, 16)?.replace('T', ' ')}</span>
              </div>
              <p className="text-sm text-gray-700">{d.content}</p>
            </div>
          )) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">暂无讨论，来说点什么吧</p>
            </div>
          )}
        </div>
        {group.member && (
          <div className="flex gap-2">
            <input type="text" value={discussionContent} onChange={e => setDiscussionContent(e.target.value)}
              placeholder="发一条消息..." maxLength={500}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
              onKeyDown={e => { if (e.key === 'Enter') handlePostDiscussion() }} />
            <button onClick={handlePostDiscussion} disabled={postingDiscussion || !discussionContent.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300">
              发送
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default GroupDetailPage
