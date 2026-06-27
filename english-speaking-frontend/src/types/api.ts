/** API 统一响应格式 */
export interface Result<T> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PageResult<T> {
  code: number
  message: string
  data: {
    items: T[]
    total: number
    page: number
    page_size: number
  }
}
