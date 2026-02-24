import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { useThemeColors } from '../../hooks/useThemeColors'

interface EpisodeDurationChartProps {
  /** Array of episode durations (steps survived per episode) */
  durations: number[]
  rollingWindow?: number
}

export function EpisodeDurationChart({ durations, rollingWindow = 20 }: EpisodeDurationChartProps) {
  const tc = useThemeColors()

  const data = useMemo(() => {
    return durations.map((d, i) => {
      const windowStart = Math.max(0, i - rollingWindow + 1)
      const windowSlice = durations.slice(windowStart, i + 1)
      const avg = windowSlice.reduce((s, v) => s + v, 0) / windowSlice.length

      return {
        episode: i + 1,
        duration: d,
        avg: Math.round(avg * 10) / 10,
      }
    })
  }, [durations, rollingWindow])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-surface-light rounded-xl border border-surface-lighter">
        <p className="text-sm text-text-muted">No episodes completed yet — press Play or Step</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Episode Duration (Steps Survived)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={tc.chartGrid} />
          <XAxis dataKey="episode" stroke={tc.chartAxis} fontSize={11} label={{ value: 'Episode', position: 'insideBottom', offset: -2, fontSize: 10, fill: tc.textMuted }} />
          <YAxis stroke={tc.chartAxis} fontSize={11} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: tc.tooltipBg,
              border: `1px solid ${tc.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: tc.text,
            }}
          />
          <ReferenceLine y={500} stroke="#22c55e" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: '500 (success)', position: 'right', fontSize: 10, fill: '#22c55e' }} />
          <Line
            type="monotone"
            dataKey="avg"
            stroke={tc.primary}
            strokeWidth={2}
            dot={false}
            name="Rolling Avg"
          />
          <Line
            type="monotone"
            dataKey="duration"
            stroke={`rgba(${tc.rawPrimary}, 0.2)`}
            strokeWidth={1}
            dot={false}
            name="Duration"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
