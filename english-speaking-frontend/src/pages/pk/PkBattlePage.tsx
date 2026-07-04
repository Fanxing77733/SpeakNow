/**
 * PK 对战页面
 *
 * 四阶段流程：选词 → 匹配 → 对战 → 结果
 * - 选词阶段：展示单词列表卡片（beginner绿/intermediate蓝/advanced紫）
 * - 匹配阶段：脉冲动画 + "正在寻找对手..."，每秒轮询直到匹配成功或超时
 * - 对战阶段：展示单词并模拟发音评测
 * - 结果阶段：双方得分对比 + 胜负动画
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWordLists, startPkMatch, submitPkResult, getPkStatus } from '../../api/gamification'
import type { WordListVO, PkMatchVO } from '../../types/gamification'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

/** 对战阶段 */
type Phase = 'select' | 'matching' | 'battle' | 'result'

/** 模拟单词数据（后端未来会提供单词内容接口） */
const MOCK_WORDS: Record<string, string[]> = {
  '1': ['apple', 'banana', 'cherry', 'dog', 'elephant', 'flower', 'garden', 'house'],
  '2': ['beautiful', 'chocolate', 'difficult', 'environment', 'fascinating', 'government', 'hypothesis', 'important'],
  '3': ['phenomenon', 'sophisticated', 'extraordinary', 'revolutionary', 'contemporary', 'psychological', 'entrepreneur', 'unprecedented'],
}

/** 根据 wordListId 获取模拟单词 */
function getMockWords(wordListId: number): string[] {
  const key = String(wordListId)
  return MOCK_WORDS[key] || MOCK_WORDS['1']
}

/** 模拟评测分数 (60-98) */
function mockScore(): number {
  return Math.floor(Math.random() * 39) + 60
}

/** 模拟单词列表（API 不可用时的兜底数据） */
const FALLBACK_WORD_LISTS: WordListVO[] = [
  { id: 1, name: '基础词汇挑战', description: '适合初学者的常用英语单词，覆盖日常生活基本词汇', difficulty: 'beginner', wordCount: 30 },
  { id: 2, name: '进阶词汇对决', description: '适合有一定基础的学习者，覆盖工作、学习场景常用词汇', difficulty: 'intermediate', wordCount: 30 },
  { id: 3, name: '高级词汇争霸', description: '适合高级学习者，覆盖学术、商务等正式场合词汇', difficulty: 'advanced', wordCount: 30 },
]
const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400',
  intermediate: 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400',
  advanced: 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
}

const PkBattlePage = () => {
  const navigate = useNavigate()

  // 阶段状态
  const [phase, setPhase] = useState<Phase>('select')

  // 选词
  const [wordLists, setWordLists] = useState<WordListVO[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 匹配
  const [matchData, setMatchData] = useState<PkMatchVO | null>(null)
  const [matchingTimeout, setMatchingTimeout] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 对战
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [wordScores, setWordScores] = useState<number[]>([])

  // 结果
  const [opponentScore, setOpponentScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  /** 显示 Toast */
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  // ========== 选词阶段 ==========

  /** 加载单词列表 */
  const loadWordLists = useCallback(async () => {
    setLoadingLists(true)
    setLoadError(null)
    try {
      const data = await getWordLists()
      setWordLists(data && data.length > 0 ? data : FALLBACK_WORD_LISTS)
    } catch {
      setWordLists(FALLBACK_WORD_LISTS)
    } finally {
      setLoadingLists(false)
    }
  }, [])

  useEffect(() => {
    loadWordLists()
  }, [loadWordLists])

  /** 选择单词列表并开始匹配 */
  const selectWordList = useCallback(async (wordList: WordListVO) => {
    setPhase('matching')
    setMatchingTimeout(false)
    try {
      const match = await startPkMatch(wordList.id)
      setMatchData(match)
      // 开始轮询匹配状态
      let elapsed = 0
      pollingRef.current = setInterval(async () => {
        elapsed += 1
        if (elapsed >= 10) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          // 超时直接进入对战（模拟对手）
          setPhase('battle')
          return
        }
        try {
          const status = await getPkStatus(match.id)
          setMatchData(status)
          if (status.status === 'matched' || status.status === 'p1_submitted' || status.status === 'p2_submitted') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setPhase('battle')
          }
        } catch {
          // 轮询失败，2秒后直接进入对战
          if (elapsed >= 2) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setPhase('battle')
          }
        }
      }, 1000)
    } catch {
      // API 不可用：模拟 1.5 秒匹配后直接进入对战
      if (pollingRef.current) clearInterval(pollingRef.current)
      setTimeout(() => setPhase('battle'), 1500)
    }
  }, [showToast])

  /** 取消匹配，回到选词阶段 */
  const cancelMatching = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setPhase('select')
  }, [])

  // ========== 对战阶段 ==========

  const currentWords = matchData ? getMockWords(matchData.wordListId) : []

  /** 模拟录音并评测 */
  const handleRecord = useCallback(() => {
    if (isRecording) return
    setIsRecording(true)
    // 模拟录音 1.5 秒后返回分数
    setTimeout(() => {
      const score = mockScore()
      setWordScores((prev) => [...prev, score])
      setIsRecording(false)
      // 自动跳到下一个单词
      if (currentWordIndex < currentWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1)
      }
    }, 1500)
  }, [isRecording, currentWordIndex, currentWords.length])

  /** 提交对战结果 */
  const finishBattle = useCallback(async () => {
    setSubmitting(true)
    const avgScore = wordScores.length > 0
      ? Math.round(wordScores.reduce((a, b) => a + b, 0) / wordScores.length)
      : Math.round(mockScore())
    try {
      if (matchData && matchData.id) {
        const result = await submitPkResult(matchData.id, avgScore)
        setMatchData(result)
        setOpponentScore(result.opponentScore ?? mockScore())
      }
    } catch {
      // API 不可用：模拟对手得分
      setOpponentScore(mockScore())
    } finally {
      setSubmitting(false)
      setPhase('result')
    }
  }, [matchData, wordScores])

  /** 重置，开始新一局 */
  const resetGame = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setPhase('select')
    setMatchData(null)
    setCurrentWordIndex(0)
    setWordScores([])
    setOpponentScore(0)
    setMatchingTimeout(false)
  }, [])

  /** 跳转到排行榜 */
  const goLeaderboard = useCallback(() => {
    navigate('/pk/leaderboard')
  }, [navigate])

  // ========== 渲染 ==========

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg transition-opacity">
          {toast}
        </div>
      )}

      {/* ========== 选词阶段 ========== */}
      {phase === 'select' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">PK 对战</h1>
            <button
              onClick={goLeaderboard}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              排行榜 {'→'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-6">选择一个单词列表，与随机对手进行发音对战</p>

          {/* 加载态 */}
          {loadingLists && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={160} />
              ))}
            </div>
          )}

          {/* 错误态 */}
          {loadError && !loadingLists && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{loadError}</p>
              <button
                onClick={loadWordLists}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                重新加载
              </button>
            </div>
          )}

          {/* 空态 */}
          {!loadingLists && !loadError && wordLists.length === 0 && (
            <EmptyState
              title="暂无单词列表"
              description="当前没有可用的 PK 单词列表，请稍后再试"
              actionLabel="刷新"
              onAction={loadWordLists}
            />
          )}

          {/* 单词列表卡片 */}
          {!loadingLists && !loadError && wordLists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wordLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => selectWordList(list)}
                  className={`rounded-xl border-2 p-5 text-left transition-all cursor-pointer w-full ${DIFFICULTY_STYLES[list.difficulty] || 'border-gray-200 bg-white hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_BADGE[list.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                      {DIFFICULTY_LABEL[list.difficulty] || list.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{list.wordCount} 词</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{list.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{list.description}</p>
                  <div className="mt-4 text-xs text-blue-600 font-medium">
                    开始对战 {'→'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== 匹配阶段 ========== */}
      {phase === 'matching' && (
        <div className="flex flex-col items-center justify-center py-20">
          {/* 脉冲圆圈动画 */}
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-blue-100 animate-ping absolute inset-0" />
            <div className="w-24 h-24 rounded-full bg-blue-200 animate-pulse relative flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          {matchingTimeout ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">匹配超时</h2>
              <p className="text-sm text-gray-500 mb-6">当前在线玩家较少，请稍后再试</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelMatching}
                  className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  返回列表
                </button>
                <button
                  onClick={() => {
                    setMatchingTimeout(false)
                    // 重新开始匹配（选择一个词表重新匹配，这里用之前选过的词表重新调用）
                    if (wordLists.length > 0) selectWordList(wordLists[0])
                  }}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  重试匹配
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">正在寻找对手...</h2>
              <p className="text-sm text-gray-500 mb-6">
                已选择「{matchData?.wordListName || '单词列表'}」，预计等待 5-15 秒
              </p>
              <div className="flex gap-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <button
                onClick={cancelMatching}
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm hover:bg-gray-200 transition-colors"
              >
                取消匹配
              </button>
            </>
          )}
        </div>
      )}

      {/* ========== 对战阶段 ========== */}
      {phase === 'battle' && (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">发音对战</h1>
            <span className="text-sm text-gray-500">
              {currentWordIndex + 1} / {currentWords.length}
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${((currentWordIndex + (wordScores.length > 0 ? 1 : 0)) / currentWords.length) * 100}%` }}
            />
          </div>

          {/* 当前单词 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
            <p className="text-xs text-gray-400 mb-2">请朗读以下单词</p>
            <p className="text-5xl font-bold text-gray-900 mb-2">{currentWords[currentWordIndex]}</p>
            <p className="text-sm text-gray-400">
              {isRecording ? '录音中...' : '点击下方按钮开始录音'}
            </p>
          </div>

          {/* 录音按钮 */}
          <div className="flex flex-col items-center mb-6">
            {/* 呼吸灯效果 */}
            <button
              onClick={handleRecord}
              disabled={isRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl cursor-pointer'
              }`}
            >
              {isRecording ? (
                <div className="w-4 h-4 rounded-sm bg-white" />
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              {isRecording ? '正在录音...松手自动结束' : '点击开始录音'}
            </p>
          </div>

          {/* 已完成单词的分数 */}
          {wordScores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">已评测单词</h3>
              <div className="space-y-2">
                {wordScores.map((score, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{currentWords[idx]}</span>
                    <span className={`text-sm font-semibold ${
                      score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {score} 分
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 提交按钮（所有单词评测完成后显示） */}
          {wordScores.length >= currentWords.length && (
            <button
              onClick={finishBattle}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交对战结果'}
            </button>
          )}
        </div>
      )}

      {/* ========== 结果阶段 ========== */}
      {phase === 'result' && (() => {
          const myFinalScore = matchData?.myScore ?? (wordScores.length > 0 ? Math.round(wordScores.reduce((a, b) => a + b, 0) / wordScores.length) : Math.round(mockScore()))
          const oppFinalScore = matchData?.opponentScore ?? opponentScore
          const battleResult = matchData?.result ?? (myFinalScore > oppFinalScore ? 'p1_win' : myFinalScore < oppFinalScore ? 'p2_win' : 'draw')
          const pointsEarned = matchData?.pointsEarned ?? (battleResult === 'p1_win' ? 30 : battleResult === 'draw' ? 20 : 10)

          return (
        <div className="max-w-lg mx-auto text-center">
          {/* 胜负判定 */}
          {battleResult === 'p1_win' ? (
            <div className="mb-6">
              <div className="text-6xl mb-3 animate-bounce">🎉</div>
              <h1 className="text-2xl font-bold text-yellow-600">恭喜获胜！</h1>
              <p className="text-sm text-gray-500 mt-1">
                你赢得了本次对战 +{pointsEarned} 积分
              </p>
            </div>
          ) : battleResult === 'draw' ? (
            <div className="mb-6">
              <div className="text-6xl mb-3">🤝</div>
              <h1 className="text-2xl font-bold text-blue-600">平局</h1>
              <p className="text-sm text-gray-500 mt-1">势均力敌，不分伯仲 +{pointsEarned} 积分</p>
            </div>
          ) : (
            <div className="mb-6">
              <div className="text-6xl mb-3">😔</div>
              <h1 className="text-2xl font-bold text-gray-600">很遗憾，你输了</h1>
              <p className="text-sm text-gray-500 mt-1">继续练习，下次一定赢！ +{pointsEarned} 积分</p>
            </div>
          )}

          {/* 得分对比 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-3 items-center gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">我的得分</p>
                <p className="text-3xl font-bold text-blue-600">{myFinalScore}</p>
              </div>
              <div>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-500 font-bold text-sm">VS</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{matchData?.opponentName || '对手'}得分</p>
                <p className="text-3xl font-bold text-gray-600">{oppFinalScore}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 flex justify-end">
                <div
                  className="h-3 rounded-l-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${Math.min((myFinalScore / Math.max(myFinalScore + oppFinalScore, 1)) * 100, 95)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">vs</span>
              <div className="flex-1">
                <div
                  className="h-3 rounded-r-full bg-gray-300 transition-all duration-700"
                  style={{ width: `${Math.min((oppFinalScore / Math.max(myFinalScore + oppFinalScore, 1)) * 100, 95)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={goLeaderboard}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              排行榜
            </button>
            <button
              onClick={resetGame}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              再来一局
            </button>
          </div>
        </div>
          )
      })()}
    </div>
  )
}

export default PkBattlePage
