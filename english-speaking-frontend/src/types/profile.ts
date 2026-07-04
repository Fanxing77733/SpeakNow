/** 用户画像数据（V2.0 四维画像） */
export interface PortraitData {
    // 基础维度
    age?: number;
    goal?: string;
    level?: string;
    cefrLevel?: string;
    // 能力维度
    pronunciationTrend?: string;  // "上升"|"持平"|"下降"|"无数据"|"数据不足"
    grammarAccuracy?: number;
    avgPronunciationScore?: number;
    // 偏好维度
    preferredTime?: string;  // "morning"|"afternoon"|"evening"|"night"
    preferredScenes?: string[];
    // 行为维度
    streakDays?: number;
    weeklyActiveDays?: number;
    totalPracticeCount?: number;
    avgSessionMinutes?: number;
}

/** 偏好时段中文映射 */
export const TIME_PERIOD_LABELS: Record<string, string> = {
    morning: '上午 6-12点',
    afternoon: '下午 12-18点',
    evening: '傍晚 18-22点',
    night: '夜间 22-6点',
};

/** CEFR 等级中文显示 */
export const CEFR_LABELS: Record<string, string> = {
    A1: 'A1 入门级',
    A2: 'A2 基础级',
    B1: 'B1 进阶级',
    B2: 'B2 高阶级',
    C1: 'C1 流利级',
    C2: 'C2 精通级',
};

/** 学习目标中文显示 */
export const GOAL_LABELS: Record<string, string> = {
    daily: '日常交流',
    exam: '考试备考',
    business: '商务英语',
};
