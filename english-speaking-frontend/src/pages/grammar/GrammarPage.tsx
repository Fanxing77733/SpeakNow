/**
 * 语法纠错页（V2.0）
 *
 * 功能：
 * - 文本输入 / 语音输入（调用 ASR 转写）
 * - LLM 语法纠错
 * - 逐句对比展示（原文高亮 + 纠正建议 + 语法解释）
 * - 一键收藏到错题本
 */
import { useState } from 'react'
import { checkGrammar, saveBookmark, type Correction, type GrammarCheckResult } from '../../api/grammar'
import Skeleton from '../../components/ui/Skeleton'
import Toast from '../../components/ui/Toast'

const ERROR_TYPE_LABELS: Record<string, string> = {
    spelling: '拼写错误',
    grammar: '语法错误',
    word_choice: '用词不当',
    sentence: '句式问题',
    none: '无错误',
}

const ERROR_TYPE_COLORS: Record<string, string> = {
    spelling: 'bg-amber-100 text-amber-800 border-amber-200',
    grammar: 'bg-red-100 text-red-800 border-red-200',
    word_choice: 'bg-blue-100 text-blue-800 border-blue-200',
    sentence: 'bg-purple-100 text-purple-800 border-purple-200',
    none: 'bg-green-100 text-green-800 border-green-200',
}

const GrammarPage = () => {
    const [text, setText] = useState('')
    const [result, setResult] = useState<GrammarCheckResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [savedItems, setSavedItems] = useState<Set<number>>(new Set())

    async function handleCheck() {
        if (!text.trim()) return
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const data = await checkGrammar(text.trim())
            setResult(data)
            setSavedItems(new Set())
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '服务繁忙，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    async function handleBookmark(item: Correction, index: number) {
        if (item.errorType === 'none') return
        try {
            await saveBookmark(item)
            setSavedItems(prev => new Set(prev).add(index))
            setToast({ type: 'success', message: '已收藏到错题本' })
        } catch {
            setToast({ type: 'error', message: '收藏失败，请稍后重试' })
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">语法纠错</h1>

            {/* 输入区域 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    输入英文文本
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="请输入或粘贴要检查的英文文本（最多 500 字符）..."
                    maxLength={500}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm resize-none
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none
                        text-gray-900 placeholder:text-gray-400"
                />
                <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{text.length} / 500</span>
                    <button
                        onClick={handleCheck}
                        disabled={!text.trim() || loading}
                        className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '检查中...' : '开始检查'}
                    </button>
                </div>
            </div>

            {/* 加载中 */}
            {loading && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-4">
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="text" height={60} />
                    <Skeleton variant="text" height={60} />
                </div>
            )}

            {/* 错误 */}
            {error && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                    <button onClick={() => setError(null)} className="text-sm text-red-700 underline">关闭</button>
                </div>
            )}

            {/* 纠错结果 */}
            {result && (
                <div className="space-y-4 mb-8">
                    {result.corrections.length === 0 || result.corrections[0]?.errorType === 'none' ? (
                        <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
                            <p className="text-green-700 text-sm">未检测到明显的语法或拼写错误！</p>
                        </div>
                    ) : (
                        result.corrections.map((item, idx) => (
                            <CorrectionCard
                                key={idx}
                                item={item}
                                saved={savedItems.has(idx)}
                                onBookmark={() => handleBookmark(item, idx)}
                            />
                        ))
                    )}
                </div>
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    visible={true}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}

/** 单条纠错卡片 */
function CorrectionCard({
    item,
    saved,
    onBookmark,
}: {
    item: Correction
    saved: boolean
    onBookmark: () => void
}) {
    const typeLabel = ERROR_TYPE_LABELS[item.errorType] || item.errorType
    const typeColor = ERROR_TYPE_COLORS[item.errorType] || 'bg-gray-100 text-gray-700 border-gray-200'

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* 原文（高亮错误） */}
            <div className="mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">原文</span>
                <p className="mt-1 text-sm text-red-700 bg-red-50 rounded-lg p-3 line-through">
                    {item.originalText}
                </p>
            </div>

            {/* 修改建议 */}
            <div className="mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">修改建议</span>
                <p className="mt-1 text-sm text-green-700 bg-green-50 rounded-lg p-3 font-medium">
                    {item.correctedText}
                </p>
            </div>

            {/* 解释 + 类型标签 */}
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-gray-500 flex-1">{item.explanation}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor}`}>
                        {typeLabel}
                    </span>
                    {item.errorType !== 'none' && (
                        <button
                            onClick={onBookmark}
                            disabled={saved}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors
                                ${saved
                                    ? 'bg-gray-100 text-gray-400 cursor-default'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                            {saved ? '已收藏' : '收藏'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GrammarPage
