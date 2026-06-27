/**
 * 对话 API
 *
 * 对接后端 /api/v1/chat/* 接口：
 * - POST /chat/session/start   → 创建会话 + AI 首轮消息
 * - POST /chat/message         → 发送用户语音 → ASR 转写 + AI 回复
 * - POST /chat/end/{sessionId} → 结束对话 + 独立评分
 */
import { request } from './client'
import type {
  ConversationSession,
  AIMessageResponse,
  ScoreResult,
  Scene,
  ConversationDifficulty,
} from '../types/conversation'

/**
 * 开始对话会话
 *
 * @param scene      对话场景
 * @param difficulty 对话难度
 * @returns 会话信息 + AI 第一轮消息
 */
export async function startSession(
  scene: Scene,
  difficulty: ConversationDifficulty,
): Promise<ConversationSession> {
  return request({
    method: 'POST',
    url: '/chat/session/start',
    data: { scene, difficulty },
  })
}

/**
 * 发送用户语音消息
 *
 * @param audio     录音 Blob（WebM 格式）
 * @param sessionId 会话 ID
 * @returns AI 回复 + ASR 转写文本 + 当前轮次
 */
export async function sendMessage(
  audio: Blob,
  sessionId: number,
  durationSeconds: number,
): Promise<AIMessageResponse> {
  const formData = new FormData()
  formData.append('audio', audio, 'recording.webm')
  formData.append('sessionId', String(sessionId))
  formData.append('duration', String(durationSeconds))

  return request({
    method: 'POST',
    url: '/chat/message',
    data: formData,
    // 不手动设置 Content-Type，让 axios 自动设置 multipart/form-data 含 boundary
    headers: { 'Content-Type': undefined },
  })
}

/**
 * 结束对话并获取评分
 *
 * @param sessionId 会话 ID
 * @returns 评分结果（总分 + 三维分 + 评语）
 */
export async function endSession(sessionId: number): Promise<ScoreResult> {
  return request({
    method: 'POST',
    url: `/chat/end/${sessionId}`,
  })
}
