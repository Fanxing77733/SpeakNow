/**
 * 认证 API
 *
 * 对接后端 4 个接口：
 * - POST /api/v1/auth/register → 用户注册
 * - POST /api/v1/auth/login    → 用户登录
 * - GET  /api/v1/user/profile  → 获取当前用户资料
 * - PUT  /api/v1/user/profile  → 更新当前用户资料
 */
import { request } from './client'
import type { User, LoginDTO, RegisterDTO, UpdateProfileDTO } from '../types/auth'

/** 用户登录 */
export async function login(dto: LoginDTO): Promise<{ token: string; user: User }> {
  return request({ method: 'POST', url: '/auth/login', data: dto })
}

/** 用户注册 */
export async function register(dto: RegisterDTO): Promise<{ token: string; user: User }> {
  return request({ method: 'POST', url: '/auth/register', data: dto })
}

/** 获取当前用户资料 */
export async function getProfile(): Promise<User> {
  return request({ method: 'GET', url: '/user/profile' })
}

/** 更新当前用户资料 */
export async function updateProfile(dto: UpdateProfileDTO): Promise<User> {
  return request({ method: 'PUT', url: '/user/profile', data: dto })
}
