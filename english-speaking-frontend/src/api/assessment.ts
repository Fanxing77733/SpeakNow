/**
 * 测评 API
 *
 * 对接后端 /api/v1/assessment/* 接口
 * - GET  /assessment/questions?type=fixed  → 获取 20 题（不含 correct_answer）
 * - POST /assessment/submit                → 提交答案，返回 AssessmentResult
 */
import { request } from './client'
import type { QuestionVO, AssessmentResult, AnswerItem } from '../types/assessment'

/** 获取测评题目列表（V1.0：20题固定出题） */
export async function getQuestions(type: string = 'fixed'): Promise<QuestionVO[]> {
  return request({ method: 'GET', url: '/assessment/questions', params: { type } })
}

/** 提交测评答案 */
export async function submitAnswers(answers: AnswerItem[]): Promise<AssessmentResult> {
  return request({ method: 'POST', url: '/assessment/submit', data: { answers } })
}
