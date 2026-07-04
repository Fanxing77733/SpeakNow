/**
 * 智能情景对话相关类型定义
 *
 * V2.0 扩展至 46 个场景，按 7 个类别组织
 */

/** 对话场景标识（后端 ScenePromptService 同步） */
export type Scene =
  // V1.0 基础场景
  | 'self_intro' | 'campus_life' | 'restaurant'
  // V2.0 校园生活
  | 'campus_class_discussion' | 'campus_club_activity' | 'campus_exam_prep'
  | 'campus_dorm_life' | 'campus_library' | 'campus_sports'
  | 'campus_cafeteria' | 'campus_graduation'
  // V2.0 职场商务
  | 'biz_interview' | 'biz_meeting' | 'biz_email' | 'biz_presentation'
  | 'biz_negotiation' | 'biz_networking' | 'biz_performance_review' | 'biz_client_call'
  // V2.0 旅行出行
  | 'travel_hotel' | 'travel_airport' | 'travel_directions' | 'travel_sightseeing'
  | 'travel_taxi' | 'travel_emergency' | 'travel_train' | 'travel_rental_car'
  // V2.0 购物消费
  | 'shop_clothing' | 'shop_grocery' | 'shop_electronics'
  | 'shop_returns' | 'shop_online' | 'shop_bargain'
  // V2.0 医疗健康
  | 'health_appointment' | 'health_symptoms' | 'health_pharmacy'
  | 'health_dental' | 'health_emergency' | 'health_wellness'
  // V2.0 社交日常
  | 'social_party' | 'social_phone_call' | 'social_birthday' | 'social_hobbies'
  | 'social_weather' | 'social_pets' | 'social_movies' | 'social_festivals'
  // V2.0 情景角色扮演
  | 'roleplay_interviewer' | 'roleplay_tourist' | 'roleplay_classmate'
  | 'roleplay_doctor' | 'roleplay_business'

/** 对话难度 */
export type ConversationDifficulty = 'beginner' | 'intermediate' | 'advanced'

/** 场景类别 */
export type SceneCategory = 'basic' | 'campus' | 'business' | 'travel' | 'shopping' | 'health' | 'social'

/** 场景配置（中文标签 + 图标 + 描述 + 类别） */
export interface SceneConfig {
  value: Scene
  emoji: string
  label: string
  description: string
  category: SceneCategory
}

/** 场景类别标签 */
export const CATEGORY_LABELS: Record<SceneCategory, string> = {
  basic: '基础场景',
  campus: '校园生活',
  business: '职场商务',
  travel: '旅行出行',
  shopping: '购物消费',
  health: '医疗健康',
  social: '社交日常',
}

/** 场景列表（V2.0 46 场景） */
export const SCENE_CONFIGS: SceneConfig[] = [
  // ===== 基础场景（V1.0） =====
  { value: 'self_intro', emoji: '\u{1F44B}', label: '自我介绍', description: '认识新朋友，用英语介绍自己', category: 'basic' },
  { value: 'campus_life', emoji: '\u{1F3EB}', label: '校园生活', description: '和同学聊聊学校日常和学习', category: 'basic' },
  { value: 'restaurant', emoji: '\u{1F37D}', label: '餐厅点餐', description: '完成一次完整的点餐体验', category: 'basic' },

  // ===== V2.0 校园生活 =====
  { value: 'campus_class_discussion', emoji: '\u{1F4DA}', label: '课堂讨论', description: '参与学术讨论和小组项目', category: 'campus' },
  { value: 'campus_club_activity', emoji: '\u{1F3AD}', label: '社团活动', description: '讨论社团和课外活动', category: 'campus' },
  { value: 'campus_exam_prep', emoji: '\u{1F4DD}', label: '考试准备', description: '讨论备考策略和复习方法', category: 'campus' },
  { value: 'campus_dorm_life', emoji: '\u{1F6CF}', label: '宿舍生活', description: '聊聊住宿和室友日常', category: 'campus' },
  { value: 'campus_library', emoji: '\u{1F4D6}', label: '图书馆', description: '借书、找资料和学习空间', category: 'campus' },
  { value: 'campus_sports', emoji: '\u{26BD}', label: '体育运动', description: '运动和校园体育赛事', category: 'campus' },
  { value: 'campus_cafeteria', emoji: '\u{1F35D}', label: '食堂闲聊', description: '在食堂边吃边聊的轻松对话', category: 'campus' },
  { value: 'campus_graduation', emoji: '\u{1F393}', label: '毕业规划', description: '毕业季的规划与展望', category: 'campus' },

  // ===== V2.0 职场商务 =====
  { value: 'biz_interview', emoji: '\u{1F454}', label: '工作面试', description: '模拟英文工作面试场景', category: 'business' },
  { value: 'biz_meeting', emoji: '\u{1F4CB}', label: '商务会议', description: '参与团队项目会议讨论', category: 'business' },
  { value: 'biz_email', emoji: '\u{1F4E7}', label: '商务邮件', description: '学习专业邮件沟通技巧', category: 'business' },
  { value: 'biz_presentation', emoji: '\u{1F4CA}', label: '演讲汇报', description: '练习英文演讲和汇报', category: 'business' },
  { value: 'biz_negotiation', emoji: '\u{1F91D}', label: '商务谈判', description: '练习谈判和协商技巧', category: 'business' },
  { value: 'biz_networking', emoji: '\u{1F3C6}', label: '社交人脉', description: '职场社交和建立人脉', category: 'business' },
  { value: 'biz_performance_review', emoji: '\u{1F4BC}', label: '绩效面谈', description: '讨论工作表现和职业发展', category: 'business' },
  { value: 'biz_client_call', emoji: '\u{1F4DE}', label: '客户沟通', description: '专业的客户电话沟通', category: 'business' },

  // ===== V2.0 旅行出行 =====
  { value: 'travel_hotel', emoji: '\u{1F3E8}', label: '酒店入住', description: '酒店预订和入住服务', category: 'travel' },
  { value: 'travel_airport', emoji: '\u{2708}', label: '机场登机', description: '值机、行李和登机手续', category: 'travel' },
  { value: 'travel_directions', emoji: '\u{1F5FA}', label: '问路指路', description: '在陌生城市问路和导航', category: 'travel' },
  { value: 'travel_sightseeing', emoji: '\u{1F30D}', label: '观光游览', description: '景点游览和文化体验', category: 'travel' },
  { value: 'travel_taxi', emoji: '\u{1F695}', label: '叫车出行', description: '打车和沟通目的地', category: 'travel' },
  { value: 'travel_emergency', emoji: '\u{1F6A8}', label: '紧急情况', description: '旅行中的突发情况求助', category: 'travel' },
  { value: 'travel_train', emoji: '\u{1F686}', label: '火车出行', description: '购票和乘坐火车', category: 'travel' },
  { value: 'travel_rental_car', emoji: '\u{1F697}', label: '租车自驾', description: '在国外租车自驾', category: 'travel' },

  // ===== V2.0 购物消费 =====
  { value: 'shop_clothing', emoji: '\u{1F455}', label: '服装购物', description: '买衣服、试穿和砍价', category: 'shopping' },
  { value: 'shop_grocery', emoji: '\u{1F96C}', label: '超市购物', description: '在超市采购日常用品', category: 'shopping' },
  { value: 'shop_electronics', emoji: '\u{1F4F1}', label: '电子产品', description: '购买手机、电脑等数码产品', category: 'shopping' },
  { value: 'shop_returns', emoji: '\u{1F504}', label: '退换货', description: '退货、换货和维权沟通', category: 'shopping' },
  { value: 'shop_online', emoji: '\u{1F6D2}', label: '网购咨询', description: '在线购物的客服沟通', category: 'shopping' },
  { value: 'shop_bargain', emoji: '\u{1F4B0}', label: '讨价还价', description: '在市场和摊贩砍价', category: 'shopping' },

  // ===== V2.0 医疗健康 =====
  { value: 'health_appointment', emoji: '\u{1F3E5}', label: '预约挂号', description: '预约看病和挂号流程', category: 'health' },
  { value: 'health_symptoms', emoji: '\u{1F912}', label: '描述症状', description: '向医生描述身体不适', category: 'health' },
  { value: 'health_pharmacy', emoji: '\u{1F48A}', label: '药店买药', description: '在药店咨询和购买药品', category: 'health' },
  { value: 'health_dental', emoji: '\u{1F9B7}', label: '牙科就诊', description: '看牙医和口腔健康', category: 'health' },
  { value: 'health_emergency', emoji: '\u{1F691}', label: '急诊就医', description: '紧急情况下的医院就诊', category: 'health' },
  { value: 'health_wellness', emoji: '\u{1F4AA}', label: '健康管理', description: '健身、饮食和生活方式', category: 'health' },

  // ===== V2.0 社交日常 =====
  { value: 'social_party', emoji: '\u{1F389}', label: '社交聚会', description: '聚会中的轻松社交对话', category: 'social' },
  { value: 'social_phone_call', emoji: '\u{1F4F2}', label: '电话聊天', description: '和朋友打电话闲聊', category: 'social' },
  { value: 'social_birthday', emoji: '\u{1F382}', label: '生日庆祝', description: '生日派对和送祝福', category: 'social' },
  { value: 'social_hobbies', emoji: '\u{1F3B8}', label: '兴趣爱好', description: '聊聊爱好和休闲活动', category: 'social' },
  { value: 'social_weather', emoji: '\u{2600}', label: '天气闲聊', description: '日常天气话题的轻松对话', category: 'social' },
  { value: 'social_pets', emoji: '\u{1F436}', label: '宠物话题', description: '聊聊宠物和养宠趣事', category: 'social' },
  { value: 'social_movies', emoji: '\u{1F3AC}', label: '电影娱乐', description: '讨论电影、音乐和娱乐', category: 'social' },
  { value: 'social_festivals', emoji: '\u{1F386}', label: '节日文化', description: '分享节日传统和文化', category: 'social' },
]

/** 难度标签 */
export const DIFFICULTY_LABELS: Record<ConversationDifficulty, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

/** 对话消息 */
export interface Message {
  round: number
  /** 消息角色 */
  role: 'user' | 'ai'
  /** 消息文本内容 */
  content: string
  /** 创建时间 */
  createdAt: string
}

/** 开始对话会话响应 */
export interface ConversationSession {
  sessionId: number
  scene: Scene
  status: string
  totalRounds: number
  firstMessage: Message
  /** 历史消息列表（恢复已有会话时返回） */
  messages?: Message[]
}

/** 发送消息响应（返回 AI 回复 + ASR 转写文本） */
export interface AIMessageResponse {
  round: number
  userText: string
  aiText: string
  sessionId: number
  totalRounds: number
}

/** 语法错误条目 */
export interface GrammarError {
  error: string
  correction: string
  explanation: string
}

/** 对话评分结果 */
export interface ScoreResult {
  sessionId: number
  grammarScore: number
  relevanceScore: number
  fluencyScore: number
  totalScore: number
  passScore?: number
  isPassed?: boolean
  comment: string
  /** 词汇丰富度 */
  vocabularyScore?: number
  /** 发音评分 */
  pronunciationScore?: number
  /** 互动自然度 */
  interactionScore?: number
  /** 等级标签 */
  levelLabel?: string
  /** 优点列表 */
  strengths?: string[]
  /** 待改进列表 */
  weaknesses?: string[]
  /** 语法错误详情 */
  grammarErrors?: GrammarError[]
  /** 推荐地道表达 */
  suggestedExpressions?: string[]
}

/** 角色扮演场景 */
export interface RoleplayScene {
  id: number
  sceneKey: string
  nameZh: string
  nameEn?: string
  descriptionZh: string
  difficulty: 'easy' | 'normal' | 'hard'
  difficultyLabel: string
  userRoleZh: string
  aiRoleZh: string
  aiPersonality: string
  objectiveZh: string
  totalRounds: number
  passScore: number
  iconEmoji: string
  category: string
}

/** 角色扮演历史记录项 */
export interface RoleplayHistoryItem {
  sessionId: number
  sceneKey: string
  sceneNameZh: string
  difficulty: string
  totalScore: number
  passScore: number
  isPassed: boolean
  totalRounds: number
  completedRounds: number
  grammarScore: number
  relevanceScore: number
  fluencyScore: number
  comment: string
  durationSeconds: number
  createdAt: string
}

/** 角色扮演历史记录分页 */
export interface RoleplayHistoryPage {
  total: number
  pages: number
  current: number
  records: RoleplayHistoryItem[]
}

/** 难度过滤 */
export type DifficultyFilter = 'all' | 'easy' | 'normal' | 'hard'

/** 难度标签映射 */
export const DIFFICULTY_FILTER_LABELS: Record<DifficultyFilter, string> = {
  all: '全部',
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}
