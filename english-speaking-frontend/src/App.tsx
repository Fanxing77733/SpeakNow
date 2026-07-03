/**
 * App 根组件 — 路由配置
 *
 * React Router v6/v7 路由表：
 * / → HomePage（需登录，AuthGuard 包裹）
 * /login → LoginPage（无需登录）
 * /register → RegisterPage（无需登录）
 * /profile → ProfilePage（需登录）
 * /assessment → AssessmentPage（需登录）
 * /assessment/result → AssessmentResultPage（需登录）
 * /practice → PracticePage（需登录）
 * /practice/result → PracticeResultPage（需登录）
 * /conversation → ConversationSelectPage（需登录）
 * /conversation/chat → ConversationPage（需登录）
 * /progress → ProgressPage（需登录）
 * * → 404 页面
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/guard/AuthGuard'
import AdminGuard from './components/guard/AdminGuard'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

// 页面导入
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import HomePage from './pages/home/HomePage'
import ProfilePage from './pages/profile/ProfilePage'
import AssessmentPage from './pages/assessment/AssessmentPage'
import AssessmentResultPage from './pages/assessment/AssessmentResultPage'
import PracticePage from './pages/practice/PracticePage'
import PracticeResultPage from './pages/practice/PracticeResultPage'
import ConversationSelectPage from './pages/conversation/ConversationSelectPage'
import ConversationPage from './pages/conversation/ConversationPage'
import ProgressPage from './pages/progress/ProgressPage'
import GrammarPage from './pages/grammar/GrammarPage'
import RolePlayPage from './pages/conversation/RolePlayPage'
import AdaptiveAssessmentPage from './pages/assessment/AdaptiveAssessmentPage'
import LearningPathPage from './pages/learning/LearningPathPage'
import GamificationPage from './pages/gamification/GamificationPage'
import CommunityPage from './pages/community/CommunityPage'
import GroupDetailPage from './pages/community/GroupDetailPage'
import PkBattlePage from './pages/pk/PkBattlePage'
import LeaderboardPage from './pages/pk/LeaderboardPage'
import PeerReviewPage from './pages/review/PeerReviewPage'
import PointsShopPage from './pages/shop/PointsShopPage'
import SecurityPage from './pages/profile/SecurityPage'
import SupportPage from './pages/support/SupportPage'
import SpeechPage from './pages/speech/SpeechPage'
import OfflineDownloadPage from './pages/offline/OfflineDownloadPage'
import OfflinePracticePage from './pages/offline/OfflinePracticePage'

// 管理后台页面
import ClassListPage from './pages/admin/teacher/ClassListPage'
import ClassDetailPage from './pages/admin/teacher/ClassDetailPage'
import AssignmentListPage from './pages/admin/teacher/AssignmentListPage'
import AssignmentDetailPage from './pages/admin/teacher/AssignmentDetailPage'
import ReportPage from './pages/admin/teacher/ReportPage'
import MyClassesPage from './pages/student/MyClassesPage'

// 运营端页面
import UserManagePage from './pages/admin/operator/UserManagePage'
import ReviewQueuePage from './pages/admin/operator/ReviewQueuePage'
import DashboardPage from './pages/admin/operator/DashboardPage'

/** 404 页面 */
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
    <p className="text-lg text-gray-500 mb-6">页面未找到</p>
    <a href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
      返回首页
    </a>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 无需登录的页面 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 需登录的页面：AuthGuard + Layout 包裹 */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="my-classes" element={<MyClassesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/security" element={<SecurityPage />} />
            <Route path="assessment" element={<AssessmentPage />} />
            <Route path="assessment/result" element={<AssessmentResultPage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="practice/result" element={<PracticeResultPage />} />
            <Route path="conversation" element={<ConversationSelectPage />} />
            <Route path="conversation/chat" element={<ConversationPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="grammar" element={<GrammarPage />} />
            <Route path="roleplay" element={<RolePlayPage />} />
            <Route path="adaptive" element={<AdaptiveAssessmentPage />} />
            <Route path="learning" element={<LearningPathPage />} />
            <Route path="gamification" element={<GamificationPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="community/:groupId" element={<GroupDetailPage />} />
            <Route path="pk" element={<PkBattlePage />} />
            <Route path="pk/leaderboard" element={<LeaderboardPage />} />
            <Route path="reviews" element={<PeerReviewPage />} />
            <Route path="shop" element={<PointsShopPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="speech" element={<SpeechPage />} />
            <Route path="offline" element={<OfflineDownloadPage />} />
            <Route path="offline/practice" element={<OfflinePracticePage />} />
          </Route>

          {/* 管理后台：AdminGuard + AdminLayout 包裹 */}
          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="admin/teacher/classes" element={<ClassListPage />} />
              <Route path="admin/teacher/classes/:id" element={<ClassDetailPage />} />
              <Route path="admin/teacher/assignments" element={<AssignmentListPage />} />
              <Route path="admin/teacher/assignments/:id" element={<AssignmentDetailPage />} />
              <Route path="admin/teacher/reports" element={<ReportPage />} />
              <Route path="admin/operator/users" element={<UserManagePage />} />
              <Route path="admin/operator/reviews" element={<ReviewQueuePage />} />
              <Route path="admin/operator/dashboard" element={<DashboardPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
