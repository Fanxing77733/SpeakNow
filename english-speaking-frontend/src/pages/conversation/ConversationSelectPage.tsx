/**
 * 情景对话 — 场景选择页（V2.0）
 *
 * V2.0 扩展至 46 个场景，按 7 个类别组织。用户先选类别，再选场景和难度。
 * 布局：
 * - 类别标签横向滚动
 * - 场景卡片网格（3/2/1 列响应式）
 * - 难度选择 + 开始按钮
 */
import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Toast from '../../components/ui/Toast'
import { useConversationStore } from '../../stores/conversationStore'
import {
  SCENE_CONFIGS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from '../../types/conversation'
import type { Scene, ConversationDifficulty, SceneCategory } from '../../types/conversation'

const ConversationSelectPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { initSession, isLoading, error, clearError } = useConversationStore()

  // 从 LearningPathPage 传入的任务 ID
  const learningTaskId = (location.state as { learningTaskId?: number } | null)?.learningTaskId

  const [activeCategory, setActiveCategory] = useState<SceneCategory>('basic')
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<ConversationDifficulty | null>(null)
  const [showToast, setShowToast] = useState(false)

  const canStart = selectedScene !== null && selectedDifficulty !== null

  /** 按类别过滤场景 */
  const filteredScenes = useMemo(
    () => SCENE_CONFIGS.filter((s) => s.category === activeCategory),
    [activeCategory],
  )

  /** 类别列表 */
  const categories: SceneCategory[] = ['basic', 'campus', 'business', 'travel', 'shopping', 'health', 'social']

  const handleStart = async () => {
    if (!canStart || !selectedScene || !selectedDifficulty) return
    try {
      await initSession(selectedScene, selectedDifficulty)
      navigate('/conversation/chat', { state: { scene: selectedScene, difficulty: selectedDifficulty, learningTaskId } })
    } catch {
      setShowToast(true)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">情景对话</h1>
      <p className="text-sm text-gray-500 mb-4">46 个场景，覆盖 7 大类别</p>

      {/* 类别标签 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { setActiveCategory(cat); setSelectedScene(null) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 场景卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredScenes.map((scene) => {
          const isSelected = selectedScene === scene.value
          return (
            <button
              key={scene.value}
              type="button"
              onClick={() => setSelectedScene((prev) => (prev === scene.value ? null : scene.value))}
              className={`relative bg-white rounded-xl border-2 p-5 text-left transition-all duration-200 cursor-pointer hover:shadow-md
                ${isSelected ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-gray-200 hover:border-gray-300'}`}
              aria-pressed={isSelected}
            >
              <span className="text-3xl mb-3 block" aria-hidden="true">{scene.emoji}</span>
              <h3 className="text-base font-semibold text-gray-800 mb-1">{scene.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{scene.description}</p>

              {/* 难度选择器 */}
              <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()} role="group">
                {(Object.entries(DIFFICULTY_LABELS) as [ConversationDifficulty, string][]).map(([key, label]) => {
                  const isDiffSelected = isSelected && selectedDifficulty === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (!isSelected) setSelectedScene(scene.value)
                        setSelectedDifficulty((prev) => (prev === key ? null : key))
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-150
                        ${isDiffSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {/* 开始对话按钮 */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className={`w-full max-w-sm py-3 px-6 rounded-xl text-base font-semibold transition-all duration-200
            ${canStart && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              正在创建对话...
            </span>
          ) : ('开始对话')}
        </button>
      </div>

      {!canStart && <p className="text-xs text-center text-gray-400 mt-3">请选择场景和难度后开始对话</p>}

      <Toast
        type="error"
        message={
          <span>
            {error}
            {(error?.includes('进行中的对话') || error?.includes('请先完成')) && (
              <button type="button" onClick={() => navigate('/conversation/chat')} className="ml-2 underline font-medium hover:no-underline">
                继续对话
              </button>
            )}
          </span>
        }
        visible={showToast}
        onClose={() => { setShowToast(false); clearError() }}
      />
    </div>
  )
}

export default ConversationSelectPage
