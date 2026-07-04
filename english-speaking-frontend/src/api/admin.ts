/**
 * 管理后台 API
 */
import { request } from './client'

// ====== 类型 ======

export interface ClassInfo {
  id: number
  teacherId: number
  name: string
  description?: string
  inviteCode: string
  studentCount: number
  maxStudents: number
  status: string
  createdAt: string
}

export interface ClassStudent {
  id: number
  nickname?: string
  email?: string
  level?: string
  cefrLevel?: string
}

export interface Assignment {
  id: number
  classId: number
  teacherId: number
  title: string
  description?: string
  assignmentType: string
  deadline?: string
  status: string
  submitCount: number
  createdAt: string
}

export interface AssignmentSubmission {
  id: number
  assignmentId: number
  studentId: number
  audioUrl?: string
  textContent?: string
  score?: number
  teacherReview?: string
  teacherScore?: number
  status: string
  submittedAt: string
  reviewedAt?: string
}

// ====== 班级 API ======

export async function getMyClasses(): Promise<ClassInfo[]> {
  return request({ method: 'GET', url: '/admin/teacher/classes' })
}

export async function getClassDetail(id: number): Promise<ClassInfo> {
  return request({ method: 'GET', url: `/admin/teacher/classes/${id}` })
}

export async function createClass(data: { name: string; description?: string }): Promise<ClassInfo> {
  return request({ method: 'POST', url: '/admin/teacher/classes', data })
}

export async function updateClass(id: number, data: { name: string; description?: string }): Promise<void> {
  return request({ method: 'PUT', url: `/admin/teacher/classes/${id}`, data })
}

export async function disbandClass(id: number): Promise<void> {
  return request({ method: 'DELETE', url: `/admin/teacher/classes/${id}` })
}

export async function regenerateCode(id: number): Promise<string> {
  return request({ method: 'POST', url: `/admin/teacher/classes/${id}/code` })
}

export async function getClassStudents(classId: number): Promise<ClassStudent[]> {
  return request({ method: 'GET', url: `/admin/teacher/classes/${classId}/students` })
}

export async function removeStudent(classId: number, studentId: number): Promise<void> {
  return request({ method: 'DELETE', url: `/admin/teacher/classes/${classId}/students/${studentId}` })
}

// ====== 作业 API ======

export async function getAssignments(classId?: number): Promise<Assignment[]> {
  const params = classId ? `?classId=${classId}` : ''
  return request({ method: 'GET', url: `/admin/teacher/assignments${params}` })
}

export async function getAssignmentDetail(id: number): Promise<Assignment> {
  return request({ method: 'GET', url: `/admin/teacher/assignments/${id}` })
}

export async function createAssignment(data: {
  classId: number
  title: string
  description?: string
  assignmentType: string
  deadline?: string
}): Promise<Assignment> {
  return request({ method: 'POST', url: '/admin/teacher/assignments', data })
}

export async function getSubmissions(assignmentId: number): Promise<AssignmentSubmission[]> {
  return request({ method: 'GET', url: `/admin/teacher/assignments/${assignmentId}/submissions` })
}

export async function reviewSubmission(
  assignmentId: number,
  submissionId: number,
  data: { teacherReview?: string; teacherScore?: number }
): Promise<void> {
  return request({
    method: 'POST',
    url: `/admin/teacher/assignments/${assignmentId}/submissions/${submissionId}/review`,
    data,
  })
}

// ====== 报告 API ======

export async function getClassReport(classId: number): Promise<Record<string, any>> {
  return request({ method: 'GET', url: `/admin/teacher/reports/class?classId=${classId}` })
}

// ====== 用户管理 API（运营端） ======

export interface UserInfo {
  id: number
  email?: string
  phone?: string
  nickname?: string
  role?: string
  level?: string
  cefrLevel?: string
  status?: string
  createdAt?: string
}

export async function searchUsers(params: {
  keyword?: string
  status?: string
  page?: number
  size?: number
}): Promise<{ records: UserInfo[]; total: number; current: number; size: number }> {
  return request({ method: 'GET', url: '/admin/operator/users', params })
}

export async function banUser(userId: number, reason?: string): Promise<void> {
  return request({ method: 'POST', url: `/admin/operator/users/${userId}/ban`, data: { userId, reason } })
}

export async function unbanUser(userId: number): Promise<void> {
  return request({ method: 'POST', url: `/admin/operator/users/${userId}/unban` })
}

// ====== 内容审核 API（运营端） ======

export interface ReviewItem {
  id: number
  contentType: string
  contentId: number
  userId: number
  userNickname?: string
  contentText?: string
  aiScore?: number
  aiTags?: string
  status: string
  createdAt: string
}

export async function getReviewQueue(params: {
  status?: string
  page?: number
  size?: number
}): Promise<{ records: ReviewItem[]; total: number; current: number; size: number }> {
  return request({ method: 'GET', url: '/admin/operator/reviews', params })
}

export async function reviewContent(
  reviewId: number,
  data: { action: string; comment?: string }
): Promise<void> {
  return request({ method: 'POST', url: `/admin/operator/reviews/${reviewId}/decision`, data })
}

// ====== 数据看板 API（运营端） ======

export async function getDashboardOverview(): Promise<Record<string, any>> {
  return request({ method: 'GET', url: '/admin/operator/dashboard/overview' })
}

export async function getDashboardUsers(): Promise<Record<string, any>> {
  return request({ method: 'GET', url: '/admin/operator/dashboard/users' })
}

// ====== 作业报告 ======

export interface AssignmentReport {
  assignment: Assignment
  students: {
    studentId: number
    nickname: string
    email: string
    submitted: boolean
    submissionId?: number
    content?: string
    score?: number
    teacherScore?: number
    teacherReview?: string
    status?: string
    submittedAt?: string
  }[]
  submittedCount: number
  totalStudents: number
}

export async function getAssignmentReport(assignmentId: number): Promise<AssignmentReport> {
  return request({ method: 'GET', url: `/admin/teacher/assignments/${assignmentId}/report` })
}
