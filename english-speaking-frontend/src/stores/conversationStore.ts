/**
 * 对话状态管理
 *
 * 管理对话页的核心状态：消息列表、会话 ID、轮次、评分结果等。
 * 页面离开时状态重置（不持久化）。
 */
import { create } from 'zustand'
import axios from 'axios'
import type {
  Scene,
  ConversationDifficulty,
  Message,
  ConversationSession,
  AIMessageResponse,
  ScoreResult,
} from '../types/conversation'
import * as conversationApi from '../api/conversation'

/** 对话页运行状态 */
export type ConversationStatus =
  | 'idle'         // 初始：未开始
  | 'active'       // 对话进行中
  | 'ending'       // 正在结束对话（调评分 API）
  | 'completed'    // 对话已结束，展示评分
  | 'error'        // 发生错误

/** 录音上传状态 */
export type RecordingState = 'idle' | 'recording' | 'uploading' | 'asr_failed'

interface ConversationState {
  // ---------- 会话信息 ----------
  sessionId: number | null
  scene: Scene | null
  difficulty: ConversationDifficulty | null
  totalRounds: number
  currentRound: number

  // ---------- 消息列表 ----------
  messages: Message[]

  // ---------- 状态 ----------
  status: ConversationStatus
  recordingState: RecordingState

  // ---------- 评分结果 ----------
  scoreResult: ScoreResult | null

  // ---------- 加载与错误 ----------
  isLoading: boolean
  error: string | null

  // ---------- 动作 ----------
  /** 初始化会话（调用 startSession API） */
  initSession: (scene: Scene, difficulty: ConversationDifficulty) => Promise<void>
  /** 获取当前 active 会话用于恢复（静默，无会话时返回 null） */
  fetchActiveSession: () => Promise<ConversationSession | null>
  /** 发送语音消息 */
  sendAudioMessage: (audio: Blob, durationSeconds: number) => Promise<void>
  /** 结束对话并获取评分 */
  finishConversation: () => Promise<void>
  /** 设置录音状态 */
  setRecordingState: (state: RecordingState) => void
  /** 重置所有状态（离开页面时调用） */
  reset: () => void
  /** 清除错误 */
  clearError: () => void
}

/**
 * 从 axios 错误中提取用户友好的错误消息
 */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const serverMsg = (error.response?.data as { message?: string })?.message

    // 优先使用后端返回的友好文案
    if (serverMsg && !serverMsg.includes('error') && !serverMsg.includes('exception')) {
      return serverMsg
    }

    switch (status) {
      case 404:
        return '会话不存在或已结束'
      case 409:
        return '有进行中的对话，请先完成或退出'
      case 422:
        return '未能识别语音内容，请重新录制'
      case 429:
        return '服务繁忙，请稍后再试'
      case 500:
      case 502:
      case 503:
        return '服务繁忙，请稍后重试'
      default:
        return '请求失败，请稍后重试'
    }
  }

  if (error instanceof Error && error.message === 'Network Error') {
    return '网络连接失败，请检查网络'
  }

  return '操作失败，请稍后重试'
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  // ---------- 初始状态 ----------
  sessionId: null,
  scene: null,
  difficulty: null,
  totalRounds: 5,
  currentRound: 0,
  messages: [],
  status: 'idle',
  recordingState: 'idle',
  scoreResult: null,
  isLoading: false,
  error: null,

  // ---------- 动作实现 ----------

  initSession: async (scene: Scene, difficulty: ConversationDifficulty) => {
    set({ isLoading: true, error: null, scene, difficulty })
    try {
      const session: ConversationSession = await conversationApi.startSession(scene, difficulty)
      set({
        sessionId: session.sessionId,
        currentRound: 1,
        messages: [session.firstMessage],
        status: 'active',
        isLoading: false,
      })
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ error: message, isLoading: false, status: 'error' })
      throw new Error(message)
    }
  },

  fetchActiveSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const session: ConversationSession = await conversationApi.getActiveSession()
      set({
        sessionId: session.sessionId,
        scene: session.scene,
        totalRounds: session.totalRounds,
        currentRound: session.totalRounds,
        messages: session.messages && session.messages.length > 0 ? session.messages : [session.firstMessage],
        status: 'active',
        isLoading: false,
      })
      return session
    } catch {
      set({ isLoading: false })
      return null
    }
  },

  sendAudioMessage: async (audio: Blob, durationSeconds: number) => {
    const { sessionId } = get()
    if (!sessionId) {
      set({ error: '会话未初始化，请重新开始', status: 'error' })
      return
    }

    set({ recordingState: 'uploading', error: null })
    try {
      const response: AIMessageResponse = await conversationApi.sendMessage(audio, sessionId, durationSeconds)

      // 构造用户消息（ASR 转写文本）
      const userMessage: Message = {
        round: response.round,
        role: 'user',
        content: response.userText,
        createdAt: new Date().toISOString(),
      }

      // 构造 AI 消息
      const aiMessage: Message = {
        round: response.round,
        role: 'ai',
        content: response.aiText,
        createdAt: new Date().toISOString(),
      }

      const newRound = response.totalRounds

      set((state) => ({
        messages: [...state.messages, userMessage, aiMessage],
        currentRound: newRound,
        recordingState: 'idle',
      }))
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ recordingState: 'asr_failed', error: message })
    }
  },

  finishConversation: async () => {
    const { sessionId } = get()
    if (!sessionId) return

    set({ status: 'ending', isLoading: true, error: null })
    try {
      const score: ScoreResult = await conversationApi.endSession(sessionId)
      set({
        scoreResult: score,
        status: 'completed',
        isLoading: false,
      })
    } catch (error: unknown) {
      const message = extractErrorMessage(error)
      set({ error: message, isLoading: false, status: 'error' })
    }
  },

  setRecordingState: (recordingState: RecordingState) => {
    set({ recordingState })
  },

  reset: () => {
    set({
      sessionId: null,
      scene: null,
      difficulty: null,
      totalRounds: 5,
      currentRound: 0,
      messages: [],
      status: 'idle',
      recordingState: 'idle',
      scoreResult: null,
      isLoading: false,
      error: null,
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))
