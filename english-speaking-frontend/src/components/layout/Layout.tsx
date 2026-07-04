/**
 * 布局容器
 *
 * 包裹所有需鉴权的页面：Header + 内容区（Outlet）
 * 响应式适配 375px（手机）到 1440px（桌面）
 */
import { Outlet } from 'react-router-dom'
import Header from './Header'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #F0FDFA 0%, #E8FAF6 30%, #F0FDFA 100%)' }}>
      {/* 顶部装饰光晕 */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)' }} />

      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-10">
        <Outlet />
      </main>

      {/* 底部装饰 */}
      <footer className="text-center py-6 text-xs text-teal-600/40 font-medium">
        SpeakingNow · AI 英语口语训练
      </footer>
    </div>
  )
}

export default Layout
