import { request } from './client'
import type { SpeechTopic, SpeechEvalResult } from '../types/speech'

/** 获取话题列表 */
export function getSpeechTopics(category?: string, difficulty?: string): Promise<SpeechTopic[]> {
  const params: Record<string, string> = {}
  if (category) params.category = category
  if (difficulty) params.difficulty = difficulty
  return request({ url: '/speech/topics', params })
}

/** 获取话题详情 */
export function getSpeechTopicDetail(id: number): Promise<SpeechTopic> {
  return request({ url: `/speech/topics/${id}` })
}

/** 开始陈述 */
export function startSpeech(topicId: number): Promise<number> {
  return request({ method: 'POST', url: '/speech/start', params: { topicId } })
}

/** 提交录音 */
export function submitSpeech(sessionId: number, audio: Blob, durationSeconds: number): Promise<SpeechEvalResult> {
  const formData = new FormData()
  formData.append('audio', audio, 'recording.webm')
  formData.append('durationSeconds', String(durationSeconds))
  return request({
    method: 'POST',
    url: `/speech/${sessionId}/submit`,
    data: formData,
    headers: { 'Content-Type': undefined },
  })
}

/** 获取评估结果 */
export function getSpeechResult(sessionId: number): Promise<SpeechEvalResult> {
  return request({ url: `/speech/${sessionId}/result` })
}
