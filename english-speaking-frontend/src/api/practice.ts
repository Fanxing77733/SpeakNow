/**
 * 发音评测 API
 *
 * 对接后端 /eval 接口：
 * - GET  /eval/content?difficulty= → 获取跟读句子列表
 * - POST /eval/pronounce          → multipart 上传音频+评测
 * - GET  /eval/result/{recordId}  → 获取历史评测详情
 */
import { request } from './client'
import type { ContentSentence, PronounceEvalResult, Difficulty } from '../types/practice'

/**
 * 获取跟读句子列表
 * @param difficulty 可选难度筛选（留空返回全部）
 */
export async function getContentList(
  difficulty?: Difficulty,
): Promise<ContentSentence[]> {
  const params = difficulty ? { difficulty } : undefined
  return request<ContentSentence[]>({
    method: 'GET',
    url: '/eval/content',
    params,
  })
}

/**
 * 上传录音并获取发音评测结果
 * @param audio 录音 Blob（WebM 格式）
 * @param contentId 对应跟读内容 ID
 * @param durationSeconds 前端 MediaRecorder 计时的实际录音时长（秒）
 */
export async function evaluatePronunciation(
  audio: Blob,
  contentId: number,
  durationSeconds: number,
): Promise<PronounceEvalResult> {
  const formData = new FormData()
  formData.append('audio', audio, 'recording.webm')
  formData.append('contentId', String(contentId))
  formData.append('duration', String(durationSeconds))

  // 不手动设置 Content-Type — Axios 会为 FormData 自动生成含 boundary 的正确值
  return request<PronounceEvalResult>({
    method: 'POST',
    url: '/eval/pronounce',
    data: formData,
  })
}

/**
 * 获取历史评测详情
 * @param recordId 评测记录 ID
 */
export async function getResultDetail(
  recordId: number,
): Promise<PronounceEvalResult> {
  return request<PronounceEvalResult>({
    method: 'GET',
    url: `/eval/result/${recordId}`,
  })
}
