/**
 * 学习报告页 — 选择班级查看概览
 */
import { useState, useEffect, useCallback } from 'react'
import { getMyClasses, getClassReport, type ClassInfo } from '../../../api/admin'

export default function ReportPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<number>(0)
  const [report, setReport] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  const loadClasses = useCallback(async () => {
    try {
      setClasses(await getMyClasses())
    } catch { /* handled */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadClasses() }, [loadClasses])

  const loadReport = async (classId: number) => {
    setSelectedClass(classId)
    try {
      setReport(await getClassReport(classId))
    } catch { setReport(null) }
  }

  if (loading) return <p className="text-gray-400">加载中...</p>

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">学习报告</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {classes.filter(c => c.status === 'ACTIVE').map(c => (
          <button key={c.id} onClick={() => loadReport(c.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              selectedClass === c.id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {!report && <p className="text-gray-400 text-sm">请选择一个班级查看报告</p>}

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="班级名称" value={report.className} />
          <StatCard label="学生人数" value={report.studentCount} />
          <StatCard label="作业数量" value={report.assignmentCount} />
          <StatCard label="总提交数" value={report.totalSubmissions} />
          <StatCard label="已完成批改" value={report.totalReviewed} />
          <StatCard label="完成率" value={report.completionRate + '%'} />
          <StatCard label="平均分" value={report.averageScore || '-'} />
        </div>
      )}
    </div>
  )
}

const StatCard = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-xl font-bold text-gray-900">{value}</p>
  </div>
)
