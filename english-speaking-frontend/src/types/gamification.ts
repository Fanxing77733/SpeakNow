// ========== 闯关学习 ==========

export interface LevelVO {
  id: number;
  stageId: number;
  levelOrder: number;
  name: string;
  description: string;
  passCompletionRate: number;
  passAvgScore: number;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
  completedTasks: number;
  totalTasks: number;
  avgScore: number | null;
  tasks: StageTaskVO[];
  rewardBadgeType: string;
  rewardBadgeName: string;
  rewardPoints: number;
}

export interface StageTaskVO {
  index: number;
  name: string;
  type: 'practice' | 'conversation' | 'grammar';
  description: string;
  completed: boolean;
}

export interface StageVO {
  id: number;
  name: string;
  order: number;
  unlocked: boolean;
  completed: boolean;
  taskCount: number;
  completedCount: number;
  tasks: StageTaskVO[];
  rewardBadge: string;
  rewardPoints: number;
}

// ========== 积分与勋章 ==========

export interface BadgeVO {
  badgeType: string;
  badgeName: string;
  earnedAt: string | null;
}

export interface PointsVO {
  totalPoints: number;
  totalRank: number;
}

export interface PointsHistoryVO {
  id: number;
  points: number;
  reason: string;
  referenceId: number | null;
  createdAt: string;
}

export interface ShopItemVO {
  id: number;
  name: string;
  description: string;
  icon: string;
  price: number;
  itemType: string;
  stock: number;
  purchased: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  score: number;
}

// ========== PK对战 ==========

export interface WordListVO {
  id: number;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  wordCount: number;
}

export interface PkMatchVO {
  id: number;
  status: string;
  wordListId: number;
  wordListName: string;
  myScore: number | null;
  opponentScore: number | null;
  opponentName: string;
  result: 'p1_win' | 'p2_win' | 'draw' | null;
  pointsEarned: number;
}

// ========== 学习小组 ==========

export interface GroupVO {
  id: number;
  name: string;
  memberCount: number;
  visibility: string;
}

export interface GroupDetailVO {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  visibility: string;
  ownerId: number;
  ownerName: string;
  member: boolean;
  myRole: string | null;
  topicPushEnabled: boolean;
  challenges: ChallengeVO[];
  discussions: DiscussionVO[];
}

export interface ChallengeVO {
  id: number;
  title: string;
  contentId: number;
  contentText: string;
  status: string;
  startsAt: string;
  endsAt: string;
  participantCount: number;
  userSubmitted: boolean;
  myBestScore: number | null;
  myRank: number | null;
}

export interface DiscussionVO {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface JoinRequestVO {
  id: number;
  userId: number;
  userName: string;
  status: string;
  requestedAt: string;
}

export interface TopicVO {
  id: number;
  topicContent: string;
  pushedAt: string;
}

// ========== 匿名互评 ==========

export interface ReviewAssignmentVO {
  id: number;
  recordingId: number;
  sentencePreview: string;
  userName: string;
  status: string;
  assignedAt: string;
}

export interface ReviewStatsVO {
  recordingId: number;
  reviewCount: number;
  avgScore: number;
  aiScore: number;
  verified: boolean;
}
