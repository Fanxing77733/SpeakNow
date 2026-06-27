/**
 * 情景对话 — 场景选择页
 *
 * 用户在此选择对话场景和难度后，调用 startSession API 创建会话，
 * 成功后跳转到 /conversation/chat 开始对话。
 *
 * 布局：
 * - 页面标题 + 副标题
 * - 3 个场景卡片（桌面 3 列 / 平板 2 列 / 手机 1 列）
 * - 每个卡片：场景图标 + 名称 + 描述 + 难度选择器（初级/中级/高级）
 * - "开始对话"按钮（场景 + 难度都选中后激活）
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/ui/Toast'
import { useConversationStore } from '../../stores/conversationStore'
import {
  SCENE_CONFIGS,
  DIFFICULTY_LABELS,
} from '../../types/conversation'
import type { Scene, ConversationDifficulty } from '../../types/conversation'

const ConversationSelectPage = () => {
  const navigate = useNavigate()
  const { initSession, isLoading, error, clearError } = useConversationStore()

  /** 当前选中的场景 */
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  /** 当前选中的难度 */
  const [selectedDifficulty, setSelectedDifficulty] = useState<ConversationDifficulty | null>(null)
  /** Toast 可见性 */
  const [showToast, setShowToast] = useState(false)

  /** 是否可以开始对话（场景 + 难度都已选中） */
  const canStart = selectedScene !== null && selectedDifficulty !== null

  /** 处理开始对话 */
  const handleStart = async () => {
    if (!canStart || !selectedScene || !selectedDifficulty) return

    try {
      await initSession(selectedScene, selectedDifficulty)
      // 成功后跳转，通过 location state 传递场景信息（仅用于 UI 展示）
      navigate('/conversation/chat', {
        state: {
          scene: selectedScene,
          difficulty: selectedDifficulty,
        },
      })
    } catch {
      // 错误已在 store 中设置，显示 Toast
      setShowToast(true)
    }
  }

  /** 选择场景 */
  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene((prev) => (prev === scene ? null : scene))
  }

  /** 选择难度 */
  const handleDifficultySelect = (difficulty: ConversationDifficulty) => {
    setSelectedDifficulty((prev) => (prev === difficulty ? null : difficulty))
  }

  return (
    <div>
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        情景对话
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        选择场景开始练习
      </p>

      {/* 场景卡片网格：桌面 3 列 / 平板 2 列 / 手机 1 列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {SCENE_CONFIGS.map((scene) => {
          const isSelected = selectedScene === scene.value

          return (
            <button
              key={scene.value}
              type="button"
              onClick={() => handleSceneSelect(scene.value)}
              className={`
                relative bg-white rounded-xl border-2 p-5 text-left
                transition-all duration-200 cursor-pointer
                hover:shadow-md
                ${isSelected
                  ? 'border-blue-500 shadow-md shadow-blue-500/10'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              aria-pressed={isSelected}
            >
              {/* 场景图标 */}
              <span className="text-3xl mb-3 block" aria-hidden="true">
                {scene.emoji}
              </span>
              {/* 场景名称 */}
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {scene.label}
              </h3>
              {/* 场景描述 */}
              <p className="text-xs text-gray-500 leading-relaxed">
                {scene.description}
              </p>

              {/* 难度选择器 */}
              <div
                className="flex gap-2 mt-4"
                onClick={(e) => e.stopPropagation()}
                role="group"
                aria-label={`${scene.label} 难度选择`}
              >
                {(Object.entries(DIFFICULTY_LABELS) as [ConversationDifficulty, string][]).map(
                  ([key, label]) => {
                    const isDifficultySelected =
                      isSelected && selectedDifficulty === key

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          // 选择难度的同时自动选中场景
                          if (!isSelected) {
                            setSelectedScene(scene.value)
                          }
                          handleDifficultySelect(key)
                        }}
                        className={`
                          flex-1 py-1.5 px-3 rounded-lg text-xs font-medium
                          transition-all duration-150
                          ${isDifficultySelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {label}
                      </button>
                    )
                  },
                )}
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
          className={`
            w-full max-w-sm py-3 px-6 rounded-xl text-base font-semibold
            transition-all duration-200
            ${canStart && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              正在创建对话...
            </span>
          ) : (
            '开始对话'
          )}
        </button>
      </div>

      {/* 提示文字：引导用户完成选择 */}
      {!canStart && (
        <p className="text-xs text-center text-gray-400 mt-3">
          请选择场景和难度后开始对话
        </p>
      )}

      {/* 错误 Toast */}
      <Toast
        type="error"
        message={
          <span>
            {error}
            {(error?.includes('进行中的对话') || error?.includes('请先完成')) && (
              <button
                type="button"
                onClick={() => navigate('/conversation/chat')}
                className="ml-2 underline font-medium hover:no-underline"
              >
                继续对话
              </button>
            )}
          </span>
        }
        visible={showToast}
        onClose={() => {
          setShowToast(false)
          clearError()
        }}
      />
    </div>
  )
}

export default ConversationSelectPage
