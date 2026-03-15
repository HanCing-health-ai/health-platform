'use client'

// 趨勢折線圖元件（Client Component）
// 顯示最近 14 天的精力、睡眠品質、心情走勢
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/** 單一資料點型別，null 代表當天無記錄（線段中斷） */
export interface TrendDataPoint {
  date: string          // X 軸顯示用，格式 "M/D"
  energy: number | null
  sleep: number | null
  mood: number | null
}

interface Props {
  data: TrendDataPoint[]
}

/** 將指標 key 轉換為繁中標籤 */
const LABEL_MAP: Record<string, string> = {
  energy: '精力',
  sleep: '睡眠品質',
  mood: '心情',
}

/**
 * 趨勢折線圖
 * 三條線：精力（藍）、睡眠品質（綠）、心情（橘）
 * 某天無資料時值為 null，connectNulls={false} 使線段自動中斷
 */
export default function TrendChart({ data }: Props) {
  // 全部資料點均為 null 時，顯示空白提示
  const hasAnyData = data.some(
    d => d.energy != null || d.sleep != null || d.mood != null
  )

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 px-5 py-8 text-center text-gray-400 text-sm">
        尚無足夠資料顯示趨勢圖
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 pt-5 pb-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">近 14 天趨勢</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [value, LABEL_MAP[String(name)] ?? String(name)]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {LABEL_MAP[value] ?? value}
              </span>
            )}
          />
          {/* 精力：藍色 */}
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          {/* 睡眠品質：綠色 */}
          <Line
            type="monotone"
            dataKey="sleep"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          {/* 心情：橘色 */}
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
