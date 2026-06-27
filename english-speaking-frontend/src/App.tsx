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
import Layout from './components/layout/Layout'

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
            <Route path="profile" element={<ProfilePage />} />
            <Route path="assessment" element={<AssessmentPage />} />
            <Route path="assessment/result" element={<AssessmentResultPage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="practice/result" element={<PracticeResultPage />} />
            <Route path="conversation" element={<ConversationSelectPage />} />
            <Route path="conversation/chat" element={<ConversationPage />} />
            <Route path="progress" element={<ProgressPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
