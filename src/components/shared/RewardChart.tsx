import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { SimulationStep } from '../../algorithms/types'
import { useThemeColors } from '../../hooks/useThemeColors'

interface SecondarySeries {
  /** Data array — must have a `t` key matching the primary x-axis, plus one numeric value key */
  data: Record<string, number>[]
  dataKey: string
  name: string
  color?: string
  /** Domain for the right Y-axis, e.g. [0, 100] for percentages */
  domain?: [number, number]
  /** Unit suffix shown in tooltip, e.g. "%" */
  unit?: string
}

interface RewardChartProps {
  history: SimulationStep[]
  windowSize?: number
  secondary?: SecondarySeries
}

export function RewardChart({ history, windowSize = 50, secondary }: RewardChartProps) {
  const tc = useThemeColors()

  const data = useMemo(() => {
    const result: Record<string, number>[] = []
    let sum = 0

    for (let i = 0; i < history.length; i++) {
      sum += history[i].reward
      const windowStart = Math.max(0, i - windowSize + 1)
      const windowLen = i - windowStart + 1
      const windowSum = history
        .slice(windowStart, i + 1)
        .reduce((s, step) => s + step.reward, 0)

      const row: Record<string, number> = {
        t: history[i].t,
        reward: history[i].reward,
        avgReward: Math.round((windowSum / windowLen) * 1000) / 1000,
      }

      // Merge secondary data if available (matched by index)
      if (secondary?.data[i] !== undefined) {
        row[secondary.dataKey] = secondary.data[i][secondary.dataKey]
      }

      result.push(row)
    }
    return result
  }, [history, windowSize, secondary])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-surface-light rounded-xl border border-surface-lighter">
        <p className="text-sm text-text-muted">No data yet — press Play or Step</p>
      </div>
    )
  }

  const secondaryColor = secondary?.color ?? tc.accentGreen

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Reward Over Time{secondary ? ` & ${secondary.name}` : ''}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={tc.chartGrid} />
          <XAxis dataKey="t" stroke={tc.chartAxis} fontSize={11} />
          <YAxis {...(secondary ? { yAxisId: 'left' } : {})} stroke={tc.chartAxis} fontSize={11} />
          {secondary && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={secondaryColor}
              fontSize={11}
              domain={secondary.domain ?? ['auto', 'auto']}
              tickFormatter={(v: number) => `${v}${secondary.unit ?? ''}`}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: tc.tooltipBg,
              border: `1px solid ${tc.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: tc.text,
            }}
            formatter={(value: number, name: string) => {
              if (name === secondary?.name) {
                return [`${value.toFixed(1)}${secondary.unit ?? ''}`, name]
              }
              return [value.toFixed(3), name]
            }}
          />
          {secondary && <Legend wrapperStyle={{ fontSize: '11px' }} />}
          <Line
            {...(secondary ? { yAxisId: 'left' } : {})}
            type="monotone"
            dataKey="avgReward"
            stroke={tc.primary}
            strokeWidth={2}
            dot={false}
            name="Avg Reward"
          />
          {!secondary && (
            <Line
              type="monotone"
              dataKey="reward"
              stroke={`rgba(${tc.rawPrimary}, 0.2)`}
              strokeWidth={1}
              dot={false}
              name="Reward"
            />
          )}
          {secondary && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={secondary.dataKey}
              stroke={secondaryColor}
              strokeWidth={2}
              dot={false}
              name={secondary.name}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
