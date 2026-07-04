import { request } from './client'
import type { RoleplayScene, RoleplayHistoryPage } from '../types/conversation'

/** 获取角色扮演场景列表 */
export async function getScenes(difficulty?: string): Promise<RoleplayScene[]> {
  const params: Record<string, string> = {}
  if (difficulty && difficulty !== 'all') {
    params.difficulty = difficulty
  }
  return request({ method: 'GET', url: '/roleplay/scenes', params })
}

/** 获取角色扮演历史记录（分页） */
export async function getHistory(page: number = 1, size: number = 10): Promise<RoleplayHistoryPage> {
  return request({ method: 'GET', url: '/roleplay/history', params: { page, size } })
}
