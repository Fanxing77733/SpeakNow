import { request } from './client';
import type {
  LevelVO, StageVO, BadgeVO, PointsVO, PointsHistoryVO,
  ShopItemVO, LeaderboardEntry, WordListVO, PkMatchVO,
  GroupVO, GroupDetailVO, ChallengeVO, DiscussionVO,
  JoinRequestVO, TopicVO, ReviewAssignmentVO, ReviewStatsVO,
} from '../types/gamification';

// ========== 关卡 ==========

export const getLevels = () =>
  request<LevelVO[]>({ method: 'GET', url: '/levels' });

export const getLevelDetail = (levelId: number) =>
  request<LevelVO>({ method: 'GET', url: `/levels/${levelId}` });

export const getStages = () =>
  request<StageVO[]>({ method: 'GET', url: '/stages' });

export const getStageDetail = (stageId: number) =>
  request<StageVO>({ method: 'GET', url: `/stages/${stageId}` });

// ========== 勋章 ==========

export const getBadges = () =>
  request<BadgeVO[]>({ method: 'GET', url: '/badges' });

// ========== 积分 ==========

export const getPoints = () =>
  request<PointsVO>({ method: 'GET', url: '/points' });

export const getPointsHistory = (page = 1, size = 20) =>
  request<PointsHistoryVO[]>({ method: 'GET', url: '/points/history', params: { page, size } });

// ========== 积分商城 ==========

export const getShopItems = () =>
  request<ShopItemVO[]>({ method: 'GET', url: '/shop/items' });

export const purchaseItem = (itemId: number) =>
  request<void>({ method: 'POST', url: `/shop/items/${itemId}/purchase` });

export const getMyItems = () =>
  request<ShopItemVO[]>({ method: 'GET', url: '/shop/my-items' });

// ========== 排行榜 ==========

export const getLeaderboard = (type = 'total', limit = 20) =>
  request<LeaderboardEntry[]>({ method: 'GET', url: '/leaderboard', params: { type, limit } });

// ========== PK对战 ==========

export const getWordLists = () =>
  request<WordListVO[]>({ method: 'GET', url: '/pk/word-lists' });

export const startPkMatch = (wordListId: number) =>
  request<PkMatchVO>({ method: 'POST', url: '/pk/start', data: { wordListId } });

export const submitPkResult = (matchId: number, score: number) =>
  request<PkMatchVO>({ method: 'POST', url: `/pk/${matchId}/submit`, data: { score } });

export const getPkStatus = (matchId: number) =>
  request<PkMatchVO>({ method: 'GET', url: `/pk/${matchId}/status` });

export const getPkLeaderboard = (type: 'weekly' | 'monthly') =>
  request<LeaderboardEntry[]>({ method: 'GET', url: `/pk/leaderboard/${type}` });

// ========== 学习小组 ==========

export const getGroups = (visibility = 'public', keyword = '') =>
  request<GroupVO[]>({ method: 'GET', url: '/groups', params: { visibility, keyword } });

export const createGroup = (name: string, visibility = 'public', description = '') =>
  request<GroupVO>({ method: 'POST', url: '/groups', data: { name, visibility, description } });

export const getGroupDetail = (groupId: number) =>
  request<GroupDetailVO>({ method: 'GET', url: `/groups/${groupId}` });

export const joinGroup = (groupId: number) =>
  request<void>({ method: 'POST', url: `/groups/${groupId}/join` });

export const leaveGroup = (groupId: number) =>
  request<void>({ method: 'POST', url: `/groups/${groupId}/leave` });

export const requestJoinGroup = (groupId: number) =>
  request<void>({ method: 'POST', url: `/groups/${groupId}/join-request` });

export const getJoinRequests = (groupId: number) =>
  request<JoinRequestVO[]>({ method: 'GET', url: `/groups/${groupId}/join-requests` });

export const approveJoinRequest = (groupId: number, requestId: number) =>
  request<void>({ method: 'POST', url: `/groups/${groupId}/join-requests/${requestId}/approve` });

export const rejectJoinRequest = (groupId: number, requestId: number) =>
  request<void>({ method: 'POST', url: `/groups/${groupId}/join-requests/${requestId}/reject` });

export const transferOwnership = (groupId: number, newOwnerId: number) =>
  request<void>({ method: 'POST', url: `/groups/${groupId}/transfer`, data: { newOwnerId } });

export const disbandGroup = (groupId: number) =>
  request<void>({ method: 'DELETE', url: `/groups/${groupId}` });

export const getLatestTopic = (groupId: number) =>
  request<TopicVO>({ method: 'GET', url: `/groups/${groupId}/topics/latest` });

// ========== 挑战 ==========

export const getChallenges = (groupId: number) =>
  request<ChallengeVO[]>({ method: 'GET', url: `/groups/${groupId}/challenges` });

export const createChallenge = (
  groupId: number, title: string, contentId: number,
  description = '', durationHours = 168, maxSubmissions = 3
) =>
  request<ChallengeVO>({
    method: 'POST', url: `/groups/${groupId}/challenges`,
    data: { title, contentId, description, durationHours, maxSubmissions },
  });

export const submitChallenge = (challengeId: number, practiceId: number, score: number) =>
  request<ChallengeVO>({ method: 'POST', url: `/challenges/${challengeId}/submit`, data: { practiceId, score } });

export const getChallengeRanking = (challengeId: number) =>
  request<ChallengeVO[]>({ method: 'GET', url: `/challenges/${challengeId}/ranking` });

// ========== 讨论 ==========

export const getDiscussions = (groupId: number) =>
  request<DiscussionVO[]>({ method: 'GET', url: `/groups/${groupId}/discussions` });

export const postDiscussion = (groupId: number, content: string) =>
  request<DiscussionVO>({ method: 'POST', url: `/groups/${groupId}/discussions`, data: { content } });

// ========== 匿名互评 ==========

export const getPendingReviews = () =>
  request<ReviewAssignmentVO[]>({ method: 'GET', url: '/reviews/pending' });

export const submitReview = (assignmentId: number, score: number, comment: string) =>
  request<void>({ method: 'POST', url: '/reviews/submit', data: { assignmentId, score, comment } });

export const getRecordingStats = (recordingId: number) =>
  request<ReviewStatsVO>({ method: 'GET', url: `/reviews/recording/${recordingId}/stats` });
