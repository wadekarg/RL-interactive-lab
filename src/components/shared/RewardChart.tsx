import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { SimulationStep } from '../../algorithms/types'
import { useThemeColors } from '../../hooks/useThemeColors'

interface RewardChartProps {
  history: SimulationStep[]
  windowSize?: number
}

export function RewardChart({ history, windowSize = 50 }: RewardChartProps) {
  const tc = useThemeColors()

  const data = useMemo(() => {
    const result: { t: number; reward: number; avgReward: number }[] = []
    let sum = 0

    for (let i = 0; i < history.length; i++) {
      sum += history[i].reward
      const windowStart = Math.max(0, i - windowSize + 1)
      const windowLen = i - windowStart + 1
      const windowSum = history
        .slice(windowStart, i + 1)
        .reduce((s, step) => s + step.reward, 0)

      result.push({
        t: history[i].t,
        reward: history[i].reward,
        avgReward: Math.round((windowSum / windowLen) * 1000) / 1000,
      })
    }
    return result
  }, [history, windowSize])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-surface-light rounded-xl border border-surface-lighter">
        <p className="text-sm text-text-muted">No data yet — press Play or Step</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Reward Over Time
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={tc.chartGrid} />
          <XAxis dataKey="t" stroke={tc.chartAxis} fontSize={11} />
          <YAxis stroke={tc.chartAxis} fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: tc.tooltipBg,
              border: `1px solid ${tc.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: tc.text,
            }}
          />
          <Line
            type="monotone"
            dataKey="avgReward"
            stroke={tc.primary}
            strokeWidth={2}
            dot={false}
            name="Avg Reward"
          />
          <Line
            type="monotone"
            dataKey="reward"
            stroke={`rgba(${tc.rawPrimary}, 0.2)`}
            strokeWidth={1}
            dot={false}
            name="Reward"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
