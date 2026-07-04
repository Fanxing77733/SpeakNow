/**
 * 游戏化闯关页（V2.0）
 *
 * 4 个主题关卡，每关 3 个具体任务。
 * 点击任务卡片 → 跳转到对应练习页面 → 完成练习后回来进度自动更新。
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../../api/client'
import Skeleton from '../../components/ui/Skeleton'

interface Badge {
  badgeType: string
  badgeName: string
  earnedAt?: string
}

interface PointsData {
  totalPoints: number
  totalRank?: number
}

interface StageTask {
  index: number
  name: string
  type: string
  description: string
  completed: boolean
}

interface Stage {
  id: number
  name: string
  order: number
  unlocked: boolean
  completed: boolean
  taskCount: number
  completedCount: number
  tasks?: StageTask[]
  rewardBadge?: string
  rewardPoints?: number
}

const BADGE_EMOJI: Record<string, string> = {
  first_practice: '\u{1F31F}',
  first_conversation: '\u{1F4AC}',
  practice_master: '\u{1F3AF}',
  conversation_pro: '\u{1F5E3}',
  pronunciation_pro: '\u{1F399}',
  assessment_done: '\u{1F4DD}',
  streak_7: '\u{1F525}',
  stage_1_clear: '\u{1F31F}',
  stage_2_clear: '\u{1F3AF}',
  stage_3_clear: '\u{1F4DA}',
  stage_4_clear: '\u{1F3C6}',
}

const TASK_ROUTE: Record<string, string> = {
  practice: '/practice',
  conversation: '/conversation',
  grammar: '/grammar',
}

const TASK_LABEL: Record<string, string> = {
  practice: '发音评测',
  conversation: '情景对话',
  grammar: '语法纠错',
}

const GamificationPage = () => {
  const navigate = useNavigate()
  const [badges, setBadges] = useState<Badge[]>([])
  const [points, setPoints] = useState<PointsData | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)

  const loadData = useCallback(async () => {
    const [b, p, s] = await Promise.all([
      request<Badge[]>({ method: 'GET', url: '/badges' }).catch(() => [] as Badge[]),
      request<PointsData>({ method: 'GET', url: '/points' }).catch(() => null),
      request<Stage[]>({ method: 'GET', url: '/stages' }).catch(() => [] as Stage[]),
    ])
    setBadges(b || [])
    setPoints(p)
    setStages(s || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function openStage(stage: Stage) {
    if (!stage.unlocked) return
    try {
      const detail = await request<Stage>({ method: 'GET', url: `/stages/${stage.id}` })
      setSelectedStage(detail)
    } catch {
      // 降级使用列表数据
      setSelectedStage(stage)
    }
  }

  function goPractice(type: string) {
    const path = TASK_ROUTE[type]
    if (path) navigate(path)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton variant="text" width={200} height={32} className="mb-4" />
        <Skeleton variant="text" height={150} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">闯关学习</h1>

      {/* 积分 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">总积分</p>
            <p className="text-3xl font-bold text-yellow-600">{points?.totalPoints ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">全站排名</p>
            <p className="text-lg font-semibold text-gray-700">#{points?.totalRank ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* 关卡地图 */}
      <h3 className="text-sm font-medium text-gray-700 mb-3">闯关地图</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => openStage(stage)}
            disabled={!stage.unlocked}
            className={`rounded-xl border-2 p-4 text-left transition-all w-full
              ${stage.completed ? 'border-green-300 bg-green-50 hover:bg-green-100' :
                stage.unlocked ? 'border-blue-300 bg-white hover:shadow-md hover:border-blue-400 cursor-pointer' :
                'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'}`}
          >
            <p className="text-2xl mb-1">
              {stage.completed ? '\u{2705}' : stage.unlocked ? '\u{1F3AF}' : '\u{1F512}'}
            </p>
            <p className="text-sm font-medium text-gray-800">{stage.name}</p>
            <p className="text-xs text-gray-400 mt-1">{stage.completedCount}/{stage.taskCount} 完成</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${stage.completed ? 'bg-green-400' : 'bg-blue-400'}`}
                   style={{ width: `${(stage.completedCount / stage.taskCount) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stage.completed ? '\u{1F389} 已通关' : !stage.unlocked ? '\u{1F512} 未解锁' : '进行中'}
            </p>
          </button>
        ))}
      </div>

      {/* 勋章 */}
      <h3 className="text-sm font-medium text-gray-700 mb-3">我的勋章</h3>
      <div className="grid grid-cols-4 gap-3">
        {badges.length > 0 ? badges.map((badge, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl">{BADGE_EMOJI[badge.badgeType] || '\u{1F3C5}'}</p>
            <p className="text-xs text-gray-600 mt-1">{badge.badgeName}</p>
          </div>
        )) : (
          <div className="col-span-4 text-center py-6 text-sm text-gray-400">
            完成学习和挑战后，将获得勋章
          </div>
        )}
      </div>

      {/* 关卡详情弹窗 */}
      {selectedStage && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center px-4"
             onClick={() => setSelectedStage(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedStage.completed ? '\u{2705} ' : '\u{1F3AF} '}{selectedStage.name}
              </h2>
              <button onClick={() => setSelectedStage(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* 进度 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>完成进度</span>
                <span className="font-medium">{selectedStage.completedCount}/{selectedStage.taskCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-blue-500 transition-all duration-500"
                     style={{ width: `${(selectedStage.completedCount / selectedStage.taskCount) * 100}%` }} />
              </div>
            </div>

            {selectedStage.completed && (
              <div className="mb-4 flex items-center gap-3 bg-green-50 rounded-lg p-3 border border-green-200">
                <span className="text-2xl">{'\u{1F389}'}</span>
                <div>
                  <p className="text-sm font-medium text-green-700">恭喜通关！</p>
                  <p className="text-xs text-green-600">
                    获得「{selectedStage.rewardBadge}」勋章 +{selectedStage.rewardPoints} 积分
                  </p>
                </div>
              </div>
            )}

            {/* 任务列表 */}
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {selectedStage.completed ? '已完成任务' : '点击任务前往练习'}
            </h3>
            <div className="space-y-2.5">
              {(selectedStage.tasks || []).map((task) => (
                <div
                  key={task.index}
                  onClick={() => { if (!task.completed) goPractice(task.type) }}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    task.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    task.completed ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {task.completed ? '\u{2713}' : task.index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                      {task.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {task.completed ? '已完成' : `前往「${TASK_LABEL[task.type] || task.type}」练习`}
                    </p>
                  </div>
                  {task.completed ? (
                    <span className="text-xs text-green-500 shrink-0">\u{2713}</span>
                  ) : (
                    <span className="text-xs text-blue-500 shrink-0">去练习 {'\u{2192}'}</span>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedStage(null)}
              className="mt-5 w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GamificationPage
