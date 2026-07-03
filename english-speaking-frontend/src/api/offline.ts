import { request } from './client'

export interface OfflinePackSentence {
  id: number
  text: string
  difficulty: number
  topicTag: string
}

export interface OfflinePackTopic {
  id: number
  title: string
  category: string
}

export interface OfflinePack {
  version: string
  sentences: OfflinePackSentence[]
  topics: OfflinePackTopic[]
}

export interface SyncResult {
  recordId: string
  success: boolean
  asrText?: string
  totalScore?: number
  error?: string
}

/** 下载离线练习包 */
export function downloadOfflinePack(): Promise<OfflinePack> {
  return request({ url: '/offline/pack' })
}

/** 同步离线练习记录 */
export async function syncOfflineRecords(records: Array<{
  recordId: string
  contentId: number
  referenceText: string
  durationSeconds: number
  audioData: number[] // Uint8Array as number array
}>): Promise<SyncResult[]> {
  return request({
    method: 'POST',
    url: '/offline/sync',
    data: records,
  })
}
