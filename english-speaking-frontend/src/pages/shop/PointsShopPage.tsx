/**
 * 积分商城页面（V2.0）
 *
 * 功能：
 * 1. 积分余额展示（金色渐变卡片）
 * 2. 道具列表（图标/名称/描述/价格/购买状态）
 * 3. 购买确认 → 调用 purchaseItem → 刷新积分和道具列表
 * 4. 我的道具（Tab 切换或底部区域展示已购买道具）
 */
import { useState, useEffect, useCallback } from 'react'
import { getShopItems, purchaseItem, getMyItems, getPoints } from '../../api/gamification'
import type { ShopItemVO, PointsVO } from '../../types/gamification'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'

/** 道具图标映射 */
const ITEM_ICONS: Record<string, string> = {
  avatar_frame: '\u{1F5BC}️',
  name_color: '\u{1F3A8}',
  practice_double: '\u{26A1}',
  conversation_boost: '\u{1F680}',
}

/** 道具类型中文名 */
const ITEM_TYPE_LABELS: Record<string, string> = {
  avatar_frame: '头像挂件',
  name_color: '名称颜色',
  practice_double: '练习加倍',
  conversation_boost: '对话加成',
}

type TabKey = 'shop' | 'my-items'

const PointsShopPage = () => {
  // 页面数据
  const [points, setPoints] = useState<PointsVO | null>(null)
  const [shopItems, setShopItems] = useState<ShopItemVO[]>([])
  const [myItems, setMyItems] = useState<ShopItemVO[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('shop')

  // 购买状态
  const [purchasing, setPurchasing] = useState<number | null>(null)
  const [confirmItem, setConfirmItem] = useState<ShopItemVO | null>(null)

  // Toast 状态
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({
    visible: false, type: 'success', message: '',
  })

  /** 显示 Toast，2 秒后自动消失 */
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000)
  }

  /** 加载数据 */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pointsData, items, ownedItems] = await Promise.all([
        getPoints().catch(() => null),
        getShopItems().catch(() => [] as ShopItemVO[]),
        getMyItems().catch(() => [] as ShopItemVO[]),
      ])
      setPoints(pointsData)
      setShopItems(items || [])
      setMyItems(ownedItems || [])
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /** 获取道具图标 */
  const getItemIcon = (item: ShopItemVO) => {
    if (item.icon) return item.icon
    return ITEM_ICONS[item.itemType] || '\u{1F381}'
  }

  /** 获取道具类型中文名 */
  const getItemTypeLabel = (item: ShopItemVO) => {
    return ITEM_TYPE_LABELS[item.itemType] || item.itemType || '道具'
  }

  /** 执行购买 */
  const handlePurchase = async (item: ShopItemVO) => {
    setConfirmItem(null)
    if (points && item.price > points.totalPoints) {
      showToast('error', '积分不足，继续练习赚取更多积分吧')
      return
    }
    setPurchasing(item.id)
    try {
      await purchaseItem(item.id)
      // 刷新数据
      const [pointsData, items, ownedItems] = await Promise.all([
        getPoints(),
        getShopItems(),
        getMyItems(),
      ])
      setPoints(pointsData)
      setShopItems(items)
      setMyItems(ownedItems)
      showToast('success', `成功购买「${item.name}」`)
    } catch {
      showToast('error', '购买失败，请稍后重试')
    } finally {
      setPurchasing(null)
    }
  }

  /** 渲染道具卡片 */
  const renderItemCard = (item: ShopItemVO, showPurchaseButton: boolean) => {
    const isPurchasing = purchasing === item.id

    return (
      <div
        key={item.id}
        className={`bg-white rounded-xl border p-4 transition-all ${
          item.purchased
            ? 'border-gray-200 opacity-60'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
      >
        {/* 图标和类型 */}
        <div className="flex items-start justify-between mb-2">
          <span className="text-2xl">{getItemIcon(item)}</span>
          {item.purchased && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              已拥有
            </span>
          )}
        </div>

        {/* 信息 */}
        <h3 className="text-sm font-medium text-gray-800 mb-1">{item.name}</h3>
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>

        {/* 底栏：类型 + 价格/按钮 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{getItemTypeLabel(item)}</span>
          {showPurchaseButton && !item.purchased ? (
            <button
              onClick={() => setConfirmItem(item)}
              disabled={isPurchasing}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg
                         hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {'\u{1F4B0}'} {item.price}
            </button>
          ) : (
            <span className="text-sm font-semibold text-yellow-600">
              {'\u{1F4B0}'} {item.price}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ========== 加载态 ==========
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton variant="text" width="100%" height={120} className="mb-6 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton variant="circular" width={36} height={36} className="mb-3" />
              <Skeleton variant="text" width="70%" height={16} className="mb-2" />
              <Skeleton variant="text" width="90%" height={12} className="mb-3" />
              <Skeleton variant="text" width="50%" height={14} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">积分商城</h1>

      {/* 积分余额卡片 */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-5"
           style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}>
        <div className="relative z-10">
          <p className="text-sm text-yellow-100 mb-1">当前积分</p>
          <p className="text-4xl font-bold text-white">{points?.totalPoints ?? 0}</p>
          <p className="text-xs text-yellow-100 mt-2">
            全站排名 #{points?.totalRank ?? '-'}
          </p>
        </div>
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 opacity-10 text-8xl">{'\u{2B50}'}</div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'shop'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          商城道具
        </button>
        <button
          onClick={() => setActiveTab('my-items')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'my-items'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          我的道具
          {myItems.length > 0 && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              {myItems.length}
            </span>
          )}
        </button>
      </div>

      {/* 商城道具列表 */}
      {activeTab === 'shop' && (
        <>
          {shopItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {shopItems.map(item => renderItemCard(item, true))}
            </div>
          ) : (
            <EmptyState
              title="暂无道具"
              description="商城道具即将上架，敬请期待！"
            />
          )}
        </>
      )}

      {/* 我的道具列表 */}
      {activeTab === 'my-items' && (
        <>
          {myItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {myItems.map(item => renderItemCard(item, false))}
            </div>
          ) : (
            <EmptyState
              title="还没有道具"
              description="前往商城购买道具，装扮你的学习空间！"
              actionLabel="去商城"
              onAction={() => setActiveTab('shop')}
            />
          )}
        </>
      )}

      {/* ========== 购买确认弹窗 ========== */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setConfirmItem(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">确认购买</h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getItemIcon(confirmItem)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{confirmItem.name}</p>
                  <p className="text-xs text-gray-400">{getItemTypeLabel(confirmItem)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{confirmItem.description}</p>
            </div>

            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-gray-500">价格</span>
              <span className="text-xl font-bold text-yellow-600">
                {'\u{1F4B0}'} {confirmItem.price} 积分
              </span>
            </div>

            <div className="flex items-center justify-between mb-5 text-xs">
              <span className="text-gray-400">当前积分</span>
              <span className={`font-medium ${(points?.totalPoints ?? 0) >= confirmItem.price ? 'text-green-600' : 'text-red-500'}`}>
                {points?.totalPoints ?? 0} 积分
                {(points?.totalPoints ?? 0) >= confirmItem.price
                  ? `（购买后剩余 ${(points?.totalPoints ?? 0) - confirmItem.price}）`
                  : '（积分不足）'}
              </span>
            </div>

            <button
              onClick={() => handlePurchase(confirmItem)}
              disabled={purchasing !== null || (points?.totalPoints ?? 0) < confirmItem.price}
              className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium
                         hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {purchasing !== null ? '购买中…' : '确认购买'}
            </button>

            <button
              onClick={() => setConfirmItem(null)}
              className="mt-3 w-full py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium
                         hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </div>
  )
}

export default PointsShopPage
