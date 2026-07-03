/**
 * IndexedDB 离线存储工具
 * 存储离线练习包、练习记录，支持联网后同步
 */

const DB_NAME = 'es-offline'
const DB_VERSION = 1
const STORE_PACK = 'offlinePack'
const STORE_RECORDS = 'pendingRecords'

interface OfflineSentence {
  id: number
  text: string
  difficulty: number
  topicTag: string
}

interface OfflineTopic {
  id: number
  title: string
  category: string
}

interface OfflinePack {
  version: string
  sentences: OfflineSentence[]
  topics: OfflineTopic[]
}

interface PendingRecord {
  id: string
  contentId: number
  referenceText: string
  durationSeconds: number
  audioBlob: Blob
  createdAt: string
}

interface SyncStatus {
  total: number
  pending: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_PACK)) {
        db.createObjectStore(STORE_PACK, { keyPath: 'version' })
      }
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePack(pack: OfflinePack): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_PACK, 'readwrite')
  tx.objectStore(STORE_PACK).put(pack)
  return new Promise((resolve) => { tx.oncomplete = () => resolve() })
}

export async function getPack(): Promise<OfflinePack | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const request = db.transaction(STORE_PACK, 'readonly').objectStore(STORE_PACK).get('1.0')
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => resolve(null)
  })
}

export async function getSentences(): Promise<OfflineSentence[]> {
  const pack = await getPack()
  return pack?.sentences || []
}

export async function saveRecord(record: PendingRecord): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_RECORDS, 'readwrite')
  tx.objectStore(STORE_RECORDS).put(record)
  return new Promise((resolve) => { tx.oncomplete = () => resolve() })
}

export async function getPendingRecords(): Promise<PendingRecord[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const request = db.transaction(STORE_RECORDS, 'readonly').objectStore(STORE_RECORDS).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => resolve([])
  })
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_RECORDS, 'readwrite')
  tx.objectStore(STORE_RECORDS).delete(id)
  return new Promise((resolve) => { tx.oncomplete = () => resolve() })
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const records = await getPendingRecords()
  return { total: records.length, pending: records.length }
}

export async function clearAllData(): Promise<void> {
  const db = await openDB()
  const tx1 = db.transaction(STORE_PACK, 'readwrite')
  tx1.objectStore(STORE_PACK).clear()
  const tx2 = db.transaction(STORE_RECORDS, 'readwrite')
  tx2.objectStore(STORE_RECORDS).clear()
  return new Promise((resolve) => { tx2.oncomplete = () => resolve() })
}
