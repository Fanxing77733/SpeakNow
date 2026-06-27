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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
