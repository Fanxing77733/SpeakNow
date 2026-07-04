import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversationStore } from '../../stores/conversationStore'
import { getScenes, getHistory } from '../../api/roleplay'
import Skeleton from '../../components/ui/Skeleton'
import Toast from '../../components/ui/Toast'
import type {
  RoleplayScene,
  RoleplayHistoryItem,
  RoleplayHistoryPage,
  DifficultyFilter,
  Scene,
} from '../../types/conversation'
import { DIFFICULTY_FILTER_LABELS } from '../../types/conversation'

type Tab = 'scenes' | 'history'

export default function RoleplayCenterPage() {
  const navigate = useNavigate()
  const store = useConversationStore()

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('scenes')

  // 场景列表
  const [scenes, setScenes] = useState<RoleplayScene[]>([])
  const [scenesLoading, setScenesLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

  // 历史记录
  const [history, setHistory] = useState<RoleplayHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPages, setHistoryPages] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // 加载场景列表
  useEffect(() => {
    setScenesLoading(true)
    getScenes(difficultyFilter)
      .then(setScenes)
      .catch(() => setToastMsg('加载场景失败'))
      .finally(() => setScenesLoading(false))
  }, [difficultyFilter])

  // 加载历史记录
  const loadHistory = useCallback(async (page: number) => {
    setHistoryLoading(true)
    try {
      const data: RoleplayHistoryPage = await getHistory(page, 10)
      if (page === 1) {
        setHistory(data.records)
      } else {
        setHistory(prev => [...prev, ...data.records])
      }
      setHistoryPage(data.current)
      setHistoryTotal(data.total)
      setHistoryPages(data.pages)
    } catch {
      // 静默
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryPage(1)
      loadHistory(1)
    }
  }, [activeTab, loadHistory])

  // 开始角色扮演
  const handleStart = async (scene: RoleplayScene) => {
    try {
      await store.initRoleplaySession(
        scene.sceneKey as Scene,
        'intermediate',
        scene.id,
      )
      navigate('/roleplay/chat', {
        state: {
          scene: scene.sceneKey,
          roleplaySceneId: scene.id,
          totalRounds: scene.totalRounds,
        },
      })
    } catch {
      setToastMsg('启动失败，请稍后重试')
    }
  }

  // 查看历史详情
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // 是否正在对话中
  const hasActiveSession = store.sessionId && store.status === 'active'

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-teal-800" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
          🎭 角色扮演
        </h1>
        <p className="text-sm text-teal-500/70 mt-1">
          通过沉浸式对话场景练习英语口语
        </p>
      </div>

      {/* 进行中会话提示 */}
      {hasActiveSession && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">你有进行中的角色扮演会话</p>
            <p className="text-xs text-teal-500 mt-0.5">返回继续或开始新的会话</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/roleplay/chat')}
            className="clay-btn px-4 py-2 text-sm whitespace-nowrap"
          >
            继续对话
          </button>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-5 bg-teal-50/50 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('scenes')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'scenes'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-teal-500/60 hover:text-teal-600'
          }`}
        >
          新建角色扮演
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-teal-500/60 hover:text-teal-600'
          }`}
        >
          历史记录{historyTotal > 0 ? ` (${historyTotal})` : ''}
        </button>
      </div>

      {/* ===== 场景列表 Tab ===== */}
      {activeTab === 'scenes' && (
        <>
          {/* 难度过滤 */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {(Object.entries(DIFFICULTY_FILTER_LABELS) as [DifficultyFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDifficultyFilter(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  difficultyFilter === key
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 场景卡片网格 */}
          {scenesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="clay-card p-6">
                  <Skeleton variant="text" width={40} height={20} />
                  <Skeleton variant="text" width={140} height={18} className="mt-3" />
                  <Skeleton variant="text" width={260} height={14} className="mt-2" />
                  <Skeleton variant="text" width={180} height={14} className="mt-1" />
                </div>
              ))}
            </div>
          ) : scenes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-teal-400 text-sm">暂无该难度的场景</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scenes.map(scene => (
                <div key={scene.id} className="clay-card p-6 flex flex-col">
                  {/* 难度徽章 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{scene.iconEmoji}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      scene.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                      scene.difficulty === 'normal' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {scene.difficultyLabel}
                    </span>
                  </div>

                  {/* 场景名 */}
                  <h3 className="text-lg font-semibold text-teal-800 mb-2" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                    {scene.nameZh}
                  </h3>

                  {/* 描述 */}
                  <p className="text-sm text-teal-600/70 leading-relaxed mb-4">
                    {scene.descriptionZh}
                  </p>

                  {/* 角色信息 */}
                  <div className="space-y-1.5 mb-4 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-teal-500 shrink-0 mt-0.5">🎯</span>
                      <span className="text-teal-700">
                        <span className="font-medium">你扮演:</span> {scene.userRoleZh}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-teal-500 shrink-0 mt-0.5">🤖</span>
                      <span className="text-teal-700">
                        <span className="font-medium">AI:</span> {scene.aiRoleZh} — {scene.aiPersonality}
                      </span>
                    </div>
                  </div>

                  {/* 目标 */}
                  <div className="bg-teal-50/50 rounded-lg p-3 mb-4 flex-1">
                    <p className="text-xs text-teal-500 font-medium mb-1">🎯 通关目标</p>
                    <p className="text-sm text-teal-700 leading-relaxed">{scene.objectiveZh}</p>
                  </div>

                  {/* 底部信息 + 按钮 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-teal-400">
                      {scene.totalRounds} 回合 · 通过分: {scene.passScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStart(scene)}
                      disabled={store.isLoading}
                      className="clay-btn px-5 py-2 text-sm font-semibold disabled:opacity-50"
                      style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
                    >
                      {store.isLoading ? '加载中...' : '开始游戏'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== 历史记录 Tab ===== */}
      {activeTab === 'history' && (
        <>
          {historyLoading && history.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="clay-card p-5">
                  <Skeleton variant="text" width={200} height={16} />
                  <Skeleton variant="text" width={140} height={14} className="mt-2" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-teal-400/70 text-2xl mb-3">📝</p>
              <p className="text-teal-400 text-sm">暂无角色扮演记录</p>
              <p className="text-teal-400/60 text-xs mt-1">完成一次角色扮演后，记录会出现在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.sessionId}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.sessionId)}
                    className="w-full clay-card p-5 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-teal-800 truncate">
                            {item.sceneNameZh}
                          </h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            item.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                            item.difficulty === 'normal' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.difficulty === 'easy' ? 'Easy' : item.difficulty === 'normal' ? 'Normal' : 'Hard'}
                          </span>
                        </div>
                        <p className="text-xs text-teal-400/70">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            item.totalScore >= item.passScore ? 'text-emerald-500' : 'text-red-500'
                          }`} style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                            {item.totalScore.toFixed(1)}
                          </span>
                          <span className="text-xs text-teal-400/60 ml-1">分</span>
                        </div>
                        <span className={`text-xs ${
                          item.isPassed ? 'text-emerald-500' : 'text-red-400'
                        }`}>
                          {item.isPassed ? '✅ 已通过' : `❌ 未通过 (需${item.passScore})`}
                        </span>
                      </div>
                    </div>

                    {/* 展开详情 */}
                    {expandedId === item.sessionId && (
                      <div className="mt-4 pt-4 border-t border-teal-100" onClick={e => e.stopPropagation()}>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-teal-400 mb-1">语法</p>
                            <p className="text-sm font-semibold text-teal-700" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                              {item.grammarScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-teal-400 mb-1">相关性</p>
                            <p className="text-sm font-semibold text-teal-700" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                              {item.relevanceScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-teal-400 mb-1">流利度</p>
                            <p className="text-sm font-semibold text-teal-700" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
                              {item.fluencyScore.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-teal-400/60">
                          <span>{item.completedRounds}/{item.totalRounds} 回合</span>
                          <span>{(item.durationSeconds / 60).toFixed(1)} 分钟</span>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}

              {/* 加载更多 */}
              {historyPage < historyPages && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => loadHistory(historyPage + 1)}
                    disabled={historyLoading}
                    className="text-sm text-teal-500 hover:text-teal-700 disabled:opacity-50"
                  >
                    {historyLoading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {toastMsg && (
        <Toast type="error" message={toastMsg} visible onClose={() => setToastMsg(null)} />
      )}
    </div>
  )
}
