/**
 * 离线模式管理页 — 下载离线包、同步记录、管理存储
 */
import { useState, useEffect } from 'react'
import { downloadOfflinePack } from '../../api/offline'
import type { OfflinePack } from '../../api/offline'
import { savePack, getSyncStatus, getPendingRecords, deleteRecord, clearAllData } from '../../utils/offlineDb'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import Toast from '../../components/ui/Toast'

export default function OfflineDownloadPage() {
  const [pack, setPack] = useState<OfflinePack | null>(null)
  const [syncStatus, setSyncStatus] = useState({ total: 0, pending: 0 })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    const status = await getSyncStatus()
    setSyncStatus(status)
  }

  async function handleDownload() {
    setLoading(true)
    try {
      const data = await downloadOfflinePack()
      await savePack(data)
      setPack(data)
      setToast(`已下载离线包：${data.sentences.length} 条句子 + ${data.topics.length} 个话题`)
    } catch {
      setToast('下载失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    if (!isOnline) {
      setToast('当前处于离线模式，无法同步')
      return
    }
    setSyncing(true)
    try {
      const records = await getPendingRecords()
      if (records.length === 0) {
        setToast('没有需要同步的记录')
        return
      }
      // Convert Blob to base64 for transport
      const syncData = await Promise.all(records.map(async (r) => {
        const arrayBuffer = await r.audioBlob.arrayBuffer()
        const bytes = Array.from(new Uint8Array(arrayBuffer))
        return {
          recordId: r.id,
          contentId: r.contentId,
          referenceText: r.referenceText,
          durationSeconds: r.durationSeconds,
          audioData: bytes,
        }
      }))
      const resp = await fetch('/api/v1/offline/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(syncData),
      })
      const result = await resp.json()
      const results = result.data || []
      let successCount = 0
      for (const r of results) {
        if (r.success) {
          await deleteRecord(r.recordId)
          successCount++
        }
      }
      setToast(`同步完成：${successCount}/${results.length} 条成功`)
      await loadStatus()
    } catch {
      setToast('同步失败，请稍后重试')
    } finally {
      setSyncing(false)
    }
  }

  async function handleClear() {
    if (!confirm('确定要清除所有离线数据？这将删除已下载的离线包和未同步的练习记录。')) return
    await clearAllData()
    setPack(null)
    setSyncStatus({ total: 0, pending: 0 })
    setToast('已清除所有离线数据')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">离线模式</h1>
      <p className="text-sm text-gray-500 mb-6">下载练习内容，无网络也能进行跟读练习</p>

      {/* Network status */}
      <div className={`p-3 rounded-lg mb-6 ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isOnline ? '在线模式 — 所有功能可用' : '离线模式 — 仅可使用已下载的练习内容'}
        </div>
      </div>

      {/* Download pack */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">离线练习包</h2>
        <p className="text-sm text-gray-500 mb-4">
          包含跟读句子和话题陈述，下载后可离线练习。不包含音频文件，节省存储空间。
        </p>
        {pack ? (
          <div className="text-sm text-gray-600 mb-3">
            <p>已下载：{pack.sentences.length} 条句子 + {pack.topics.length} 个话题</p>
            <p className="text-xs text-gray-400 mt-1">版本：{pack.version}</p>
          </div>
        ) : (
          <p className="text-sm text-orange-600 mb-3">尚未下载离线包</p>
        )}
        <button
          onClick={handleDownload}
          disabled={loading || !isOnline}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? '下载中...' : pack ? '更新离线包' : '下载离线包'}
        </button>
      </div>

      {/* Sync records */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">同步练习记录</h2>
        <p className="text-sm text-gray-500 mb-4">
          待同步记录：{syncStatus.pending} 条（共 {syncStatus.total} 条）
        </p>
        <button
          onClick={handleSync}
          disabled={syncing || syncStatus.pending === 0 || !isOnline}
          className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors"
        >
          {syncing ? '同步中...' : '立即同步'}
        </button>
        <button
          onClick={() => window.location.href = '/offline/practice'}
          className="w-full mt-3 py-2.5 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          开始离线练习
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <h2 className="font-semibold text-red-600 mb-2">数据管理</h2>
        <p className="text-sm text-gray-500 mb-4">清除所有离线数据，包括离线包和未同步的练习记录</p>
        <button
          onClick={handleClear}
          className="w-full py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
        >
          清除所有离线数据
        </button>
      </div>

      {toast && <Toast visible={true} message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
