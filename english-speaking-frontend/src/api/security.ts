/**
 * 安全中心 API
 *
 * - PUT  /api/v1/user/password      → 修改密码
 * - GET  /api/v1/user/sessions      → 活跃设备列表
 * - DELETE /api/v1/user/sessions/:id → 踢出设备
 * - POST /api/v1/user/deactivate    → 申请注销
 * - POST /api/v1/user/reactivate    → 撤销注销
 */
import { request } from './client'

export interface SessionInfo {
  id: string
  ip: string
  userAgent: string
  loginTime: string
  current: boolean
}

export interface ChangePasswordDTO {
  oldPassword: string
  newPassword: string
}

/** 修改密码 */
export async function changePassword(dto: ChangePasswordDTO): Promise<void> {
  return request({ method: 'PUT', url: '/user/password', data: dto })
}

/** 获取活跃设备列表 */
export async function getSessions(): Promise<SessionInfo[]> {
  return request({ method: 'GET', url: '/user/sessions' })
}

/** 踢出设备 */
export async function kickSession(sessionId: string): Promise<void> {
  return request({ method: 'DELETE', url: `/user/sessions/${sessionId}` })
}

/** 申请账号注销 */
export async function deactivateAccount(): Promise<string> {
  return request({ method: 'POST', url: '/user/deactivate' })
}

/** 撤销注销申请 */
export async function cancelDeactivation(): Promise<string> {
  return request({ method: 'POST', url: '/user/reactivate' })
}
