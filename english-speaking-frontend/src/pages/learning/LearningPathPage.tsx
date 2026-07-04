/**
 * 学习路径页（V3.0）
 *
 * 支持两种模式：
 * 1. 测评后进入：显示基于 CEFR 等级的个性化学习路径（等级越高任务越多）
 * 2. 直接进入：显示预设路径选择（中考/四六级/日常）
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { request } from '../../api/client'
import Skeleton from '../../components/ui/Skeleton'
import type { CefrLevel } from '../../types/assessment'
import { CEFR_CONFIG } from '../../types/assessment'

interface PathData {
  hasPath?: boolean
  pathType?: string
  pathName?: string
  status?: string
  currentPhase?: number
  progressPct?: number
  totalPhases?: number
  message?: string
  tasks?: TaskItem[]
}

interface TaskItem {
  id: number
  phase: number
  phaseName: string
  taskType: string
  taskName: string
  status: string
  scheduledDate?: string
}

/** 个性化任务定义 */
interface PersonalTask {
  id: string
  level: CefrLevel
  taskType: string
  taskName: string
  description: string
}

const PATH_LABELS: Record<string, string> = {
  exam_middle: '中考英语冲刺',
  cet4_6: '四六级口语备考',
  daily: '日常交流提升',
  custom: '自定义路径',
}

const PATH_DESC: Record<string, string> = {
  exam_middle: '针对中考英语口语考试，涵盖自我介绍、话题演讲、看图说话等题型',
  cet4_6: '针对四六级口语考试，涵盖自我介绍、短文朗读、话题讨论等题型',
  daily: '面向日常交流场景，涵盖旅行、购物、社交等实用对话',
}

const TASK_TYPE_LABELS: Record<string, string> = {
  practice: '发音练习',
  conversation: '情景对话',
  grammar: '语法练习',
  vocab: '词汇积累',
  listening: '听力训练',
  speaking: '口语表达',
  reading: '阅读理解',
}

const TASK_EMOJI: Record<string, string> = {
  practice: '\u{1F399}',
  conversation: '\u{1F5E3}',
  grammar: '\u{1F4DD}',
  vocab: '\u{1F4D6}',
  listening: '\u{1F3A7}',
  speaking: '\u{1F3A4}',
  reading: '\u{1F4D6}',
}

const TASK_ROUTE: Record<string, string> = {
  practice: '/practice',
  conversation: '/conversation',
  grammar: '/grammar',
  vocab: '/practice',
  listening: '/assessment',
  speaking: '/speech',
  reading: '/assessment',
}

/** CEFR 等级排序 */
const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** 各等级的练习内容标签 */
const LEVEL_TASK_CONTENT: Record<CefrLevel, { vocab: string; grammar: string; topic: string }> = {
  A1: { vocab: '基础词汇', grammar: '基础句型', topic: '自我介绍' },
  A2: { vocab: '日常词汇', grammar: '常用时态', topic: '日常生活' },
  B1: { vocab: '场景词汇', grammar: '复合句型', topic: '社会话题' },
  B2: { vocab: '学术词汇', grammar: '高级语法', topic: '观点表达' },
  C1: { vocab: '专业词汇', grammar: '复杂句式', topic: '辩论演讲' },
  C2: { vocab: '精通词汇', grammar: '修辞手法', topic: '学术讨论' },
}

/** 根据用户 CEFR 等级，生成个性化任务列表 */
function generatePersonalTasks(userLevel: CefrLevel): PersonalTask[] {
  const userIdx = CEFR_ORDER.indexOf(userLevel)
  const tasks: PersonalTask[] = []

  // 任务数量分配：用户等级 8个，±1级 6个，±2级 4个，±3+级 2个
  function taskCount(levelIdx: number): number {
    const dist = Math.abs(levelIdx - userIdx)
    if (dist === 0) return 8
    if (dist === 1) return 6
    if (dist === 2) return 4
    return 2
  }

  const taskTypes = ['vocab', 'grammar', 'listening', 'speaking', 'reading', 'practice', 'conversation']

  CEFR_ORDER.forEach((level, idx) => {
    const count = taskCount(idx)
    const content = LEVEL_TASK_CONTENT[level]
    const typeLabels: Record<string, string> = {
      vocab: `${level} ${content.vocab}`,
      grammar: `${level} ${content.grammar}`,
      listening: `${level} 听力理解`,
      speaking: `${level} 口语表达`,
      reading: `${level} 阅读理解`,
      practice: `${level} 发音练习`,
      conversation: `${level} 情景对话`,
    }

    for (let i = 0; i < count; i++) {
      const typeIdx = (i + idx) % taskTypes.length
      const taskType = taskTypes[typeIdx]
      tasks.push({
        id: `lvl-${level}-${taskType}-${i + 1}`,
        level,
        taskType,
        taskName: `${typeLabels[taskType]} ${i + 1}`,
        description: `${content.topic} · ${TASK_TYPE_LABELS[taskType] || taskType}`,
      })
    }
  })

  return tasks
}

const LearningPathPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const cefrLevel = (location.state?.cefrLevel as CefrLevel) || null

  const [path, setPath] = useState<PathData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)

  // 个性化任务
  const [personalTasks] = useState<PersonalTask[]>(() =>
    cefrLevel ? generatePersonalTasks(cefrLevel) : []
  )
  // 按等级分组
  const tasksByLevel: Record<string, PersonalTask[]> = {}
  personalTasks.forEach((t) => {
    if (!tasksByLevel[t.level]) tasksByLevel[t.level] = []
    tasksByLevel[t.level].push(t)
  })

  // 已完成的个性化任务 ID
  const [completedPersonalIds, setCompletedPersonalIds] = useState<Set<string>>(new Set())

  useEffect(() => { loadPath() }, [])

  async function loadPath() {
    setLoading(true)
    setError(null)
    try {
      const data = await request<PathData>({ method: 'GET', url: '/path' })
      setPath(data)
    } catch {
      setError('加载学习路径失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  async function createPath(pathType: string) {
    setCreating(true)
    setError(null)
    try {
      const data = await request<PathData>({ method: 'POST', url: '/path/create', data: { pathType } })
      setPath(data)
    } catch {
      setError('创建路径失败，请稍后重试')
    } finally {
      setCreating(false)
    }
  }

  async function handleCompleteTask(taskId: number) {
    setCompletingId(taskId)
    try {
      const data = await request<PathData>({ method: 'POST', url: `/path/task/${taskId}/complete` })
      setPath(data)
    } catch {
      // ignore
    } finally {
      setCompletingId(null)
    }
  }

  function togglePersonalComplete(taskId: string) {
    setCompletedPersonalIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  // ============ 渲染 ============

  if (error && !cefrLevel) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">学习路径</h1>
        <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button onClick={loadPath} className="text-sm text-red-700 underline">重试</button>
        </div>
      </div>
    )
  }

  if (loading && !cefrLevel) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton variant="text" width={200} height={32} className="mb-4" />
        <Skeleton variant="text" height={200} />
      </div>
    )
  }

  // ============ 个性化学习路径（测评后进入） ============
  if (cefrLevel && personalTasks.length > 0) {
    const userConfig = CEFR_CONFIG[cefrLevel] ?? CEFR_CONFIG.A1
    const totalCompleted = completedPersonalIds.size
    const progressPct = Math.round((totalCompleted / personalTasks.length) * 100)

    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        {/* 等级徽章头部 */}
        <div className="clay-card p-8 text-center mb-6">
          <p className="text-sm text-teal-600/50 font-medium mb-3">你的英语等级</p>
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${userConfig.bgGradient}
                          ring-4 ${userConfig.ring} flex items-center justify-center shadow-xl`}>
            <span className="text-3xl font-extrabold text-white drop-shadow-sm"
              style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              {cefrLevel}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-teal-800 mb-1" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
            {userConfig.label}
          </h2>
          <p className="text-sm text-teal-600/50 font-medium">{userConfig.description}</p>
        </div>

        {/* 进度概览 */}
        <div className="clay-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-teal-700">学习进度</span>
            <span className="text-sm font-bold text-teal-600">{progressPct}%</span>
          </div>
          <div className="h-3 bg-teal-100/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                background: 'linear-gradient(90deg, #0D9488, #2DD4BF)',
                width: `${progressPct}%`,
              }}
            />
          </div>
          <p className="text-xs text-teal-400/60 mt-2 font-medium">
            已完成 {totalCompleted} / {personalTasks.length} 个任务
          </p>
        </div>

        {/* 按等级分组的任务列表 */}
        {CEFR_ORDER.filter((lvl) => tasksByLevel[lvl]?.length > 0).map((level) => {
          const levelTasks = tasksByLevel[level]
          const isUserLevel = level === cefrLevel
          const levelConfig = CEFR_CONFIG[level] ?? CEFR_CONFIG.A1

          return (
            <div key={level} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{
                    background: isUserLevel
                      ? `linear-gradient(135deg, ${levelConfig.color}, ${levelConfig.color}dd)`
                      : '#94a3b8',
                  }}
                >
                  {level} {levelConfig.label}
                  {isUserLevel && ' ⭐'}
                </span>
                <span className="text-xs text-teal-400/60 font-medium">
                  {levelTasks.length} 个任务
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {levelTasks.map((task) => {
                  const isCompleted = completedPersonalIds.has(task.id)
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all cursor-pointer
                        ${isCompleted
                          ? 'border-green-200 bg-green-50/50'
                          : isUserLevel
                            ? 'border-teal-200 bg-white hover:border-teal-400 hover:shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      onClick={() => navigate(TASK_ROUTE[task.taskType] || '/practice')}
                    >
                      <span className="text-xl shrink-0">
                        {TASK_EMOJI[task.taskType] || '\u{1F4CB}'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          isCompleted ? 'text-green-600 line-through' : 'text-teal-800'
                        }`}>
                          {task.taskName}
                        </h4>
                        <p className="text-xs text-teal-400/60 truncate">{task.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePersonalComplete(task.id)
                        }}
                        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-teal-200 text-transparent hover:border-teal-400'
                        }`}
                      >
                        {isCompleted && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* 底部 */}
        <div className="flex gap-3 mt-8 mb-4">
          <button
            onClick={() => navigate('/assessment', { replace: true })}
            className="flex-1 py-3 text-sm font-semibold text-teal-600 bg-white rounded-xl border-2 border-teal-200/60
                       hover:border-teal-300 hover:bg-teal-50/50 active:scale-[0.98] transition-all"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}
          >
            重新测评
          </button>
        </div>
      </div>
    )
  }

  // ============ 预设路径选择（直接进入） ============
  if (!path?.hasPath && !path?.pathType) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">学习路径</h1>
        <p className="text-sm text-gray-500 mb-6">选择一条适合你的学习路线，系统将为你规划每日学习任务</p>

        {/* 提示：建议先测评 */}
        {!cefrLevel && (
          <div className="clay-card p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl shrink-0">{'\u{1F4A1}'}</span>
            <div>
              <p className="text-sm font-medium text-teal-700">不确定自己的英语水平？</p>
              <p className="text-xs text-teal-500/60">建议先完成{' '}
                <button onClick={() => navigate('/assessment')} className="text-teal-600 underline font-medium">
                  英语水平测评
                </button>
                {' '}获取个性化学习路径推荐
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(PATH_LABELS).filter(([k]) => k !== 'custom').map(([key, label]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{label}</h3>
                <p className="text-xs text-gray-500 mt-1">{PATH_DESC[key]}</p>
              </div>
              <button onClick={() => createPath(key)} disabled={creating}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300">
                选择
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ============ 已有预设路径的进度展示 ============
  const pathName = PATH_LABELS[path?.pathType ?? ''] || path?.pathName || '学习路径'
  const tasks = path?.tasks || []
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const currentPhaseTasks = tasks.filter(t => t.phase === (path?.currentPhase ?? 1))

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">学习路径</h1>
      <p className="text-sm text-gray-500 mb-6">{pathName}</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">整体进度</span>
          <span className="text-sm font-medium text-blue-600">{path?.progressPct ?? 0}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
               style={{ width: `${path?.progressPct ?? 0}%` }} />
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <span>阶段 {path?.currentPhase ?? 1} / {path?.totalPhases ?? 4}</span>
          <span>完成 {completedCount} / {tasks.length} 个任务 · 每日打卡自动记录</span>
        </div>
      </div>

      {currentPhaseTasks.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            当前阶段：{currentPhaseTasks[0]?.phaseName || '阶段' + (path?.currentPhase ?? 1)}
          </h3>
          <div className="space-y-3 mb-6">
            {currentPhaseTasks.map((task) => (
              <div key={task.id}
                   className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
                     task.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-200'}`}>
                <span className="text-2xl">{TASK_EMOJI[task.taskType] || '\u{1F4CB}'}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'text-green-600' : 'text-gray-800'}`}>
                    {task.taskName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{TASK_TYPE_LABELS[task.taskType] || task.taskType}</span>
                    {task.scheduledDate && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{task.scheduledDate}</span>
                      </>
                    )}
                  </div>
                </div>
                {task.status === 'completed' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 shrink-0">
                    已完成
                  </span>
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate(TASK_ROUTE[task.taskType] || '/practice', { state: { learningTaskId: task.id } })}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100">
                      去练习
                    </button>
                    <button onClick={() => handleCompleteTask(task.id)}
                      disabled={completingId === task.id}
                      className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 disabled:bg-gray-100">
                      {completingId === task.id ? '...' : '完成'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="text-sm font-medium text-gray-700 mb-3">全部任务</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id}
               className={`flex items-center gap-3 rounded-lg border p-3 ${
                 task.status === 'completed' ? 'border-green-100 bg-green-50/50' :
                 task.phase === (path?.currentPhase ?? 1) ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'}`}>
            <span className="text-sm w-6 text-center">{TASK_EMOJI[task.taskType] || '\u{1F4CB}'}</span>
            <span className={`flex-1 text-sm ${task.status === 'completed' ? 'text-green-600 line-through' : 'text-gray-700'}`}>
              {task.taskName}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {task.status === 'completed' ? '已完成' : '待完成'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LearningPathPage
